'use strict';

const {once} = require('events');
const os = require('os');
const {join} = require('path');
const fs = require('fs');
const {
    mkdir,
    readFile,
    writeFile,
} = require('fs/promises');

const tryCatch = require('try-catch');
const {test, stub} = require('supertape');
const mockRequire = require('mock-require');
const {read} = require('redzip');
const tryToCatch = require('try-to-catch');

const remy = require('..');

const {stopAll, reRequire} = mockRequire;
const {assign} = Object;

test('remy: no args', (t) => {
    const [error] = tryCatch(remy);
    
    t.equal(error.message, 'from should be a string!', 'should throw when no args');
    t.end();
});

test('file: error EACESS', async (t) => {
    const rm = remy('/bin/ls');
    const [error] = await once(rm, 'error');
    
    t.ok(error);
    t.end();
});

test('directory: error EACESS', async (t) => {
    const rm = remy('/bin');
    const [error] = await once(rm, 'error');
    
    t.ok(error);
    t.end();
});

test('directory: error SOME_ERROR', async (t) => {
    const code = 'SOME_ERROR';
    const name = join(os.tmpdir(), String(Math.random()));
    
    const mockedError = assign(Error('Some error'), {
        code,
    });
    
    const remove = stub().throws(mockedError);
    
    mockRequire('redzip', {
        remove,
    });
    
    const remy = reRequire('..');
    const rm = remy(name);
    const [error] = await once(rm, 'error');
    
    stopAll();
    
    t.equal(error, mockedError);
    t.end();
});

test('file: no errors', async (t) => {
    const name = join('/tmp', String(Math.random()));
    fs.writeFileSync(name, 'hello world');
    const rm = remy(name);
    
    await once(rm, 'end');
    t.pass('no errors');
    t.end();
});

test('directory: no errors', async (t) => {
    const name = join(__dirname, 'fixture', 'directory-no-errors');
    await mkdir(name, {
        recursive: true,
    });
    
    const rm = remy(name);
    await once(rm, 'end');
    
    t.end();
});

test('pause/continue', async (t) => {
    const name = join('/tmp', String(Math.random()));
    fs.writeFileSync(name, 'hello world');
    const rm = remy(name);
    
    await Promise.all([
        once(rm, 'end'),
    ]);
    
    rm.pause();
    
    t.ok(rm._pause, 'pause good');
    rm.continue();
    
    t.notOk(rm._pause, 'continue good');
    t.end();
});

test('pause/continue: couple files', async (t) => {
    const name1 = String(Math.random());
    const name2 = String(Math.random());
    const full1 = join('/tmp', name1);
    const full2 = join('/tmp', name2);
    fs.writeFileSync(full1, 'hello world1');
    fs.writeFileSync(full2, 'hello world2');
    const rm = remy('/tmp', [name1, name2]);
    
    rm.once('file', () => {
        rm.pause();
        t.ok(rm._pause, 'pause good');
        
        process.nextTick(() => {
            rm.continue();
            t.notOk(rm._pause, 'continue good');
        });
    });
    
    await once(rm, 'end');
    t.end();
});

test('file: find error', async (t) => {
    const name = join('/tmp', String(Math.random()));
    const code = 'SOME';
    
    const {lstat} = fs;
    
    fs.lstat = (name, fn) => {
        const error = Error('Some error');
        error.code = code;
        
        process.nextTick(() => {
            fn(error);
        });
    };
    
    const rm = remy(name);
    const [error] = await once(rm, 'error');
    fs.lstat = lstat;
    t.equal(error.code, 'ENOENT', error);
    t.end();
});

test('remy: _progress', async (t) => {
    const name = join('/tmp', String(Math.random()));
    fs.writeFileSync(name, 'hello world');
    const rm = remy(name);
    
    rm.pause();
    rm._n = 1;
    rm._progress();
    rm._percentPrev = 200;
    rm._progress();
    rm.continue();
    
    const [result] = await Promise.all([
        once(rm, 'progress'),
        once(rm, 'end'),
    ]);
    
    const [n] = result;
    
    t.equal(n, 300, 'should emit progress once');
    t.end();
});

test('remy: file inside zip package', async (t) => {
    const outerPath = join(__dirname, 'fixture', 'hello.zip');
    const innerPath = '/hello/world.txt';
    const fixtureFile = await readFile(outerPath);
    
    await read(`${outerPath}${innerPath}`);
    const rm = remy(`${outerPath}${innerPath}`);
    
    await once(rm, 'end');
    const [error] = await tryToCatch(read, `${outerPath}${innerPath}`);
    
    await writeFile(outerPath, fixtureFile);
    
    t.ok(error);
    t.end();
});

test('remy: file inside zip package: file', async (t) => {
    const outerPath = join(__dirname, 'fixture', 'hello.zip');
    const innerPath = '/hello/world.txt';
    const fixtureFile = await readFile(outerPath);
    
    const rm = remy(`${outerPath}${innerPath}`);
    const name = await once(rm, 'file');
    
    await writeFile(outerPath, fixtureFile);
    
    t.ok(name);
    t.end();
});

test('remy: abort', async (t) => {
    const outerPath = join(__dirname, 'fixture', 'hello.zip');
    const innerPath = '/hello/world.txt';
    //const fixtureFile = await readFile(outerPath);
    const rm = remy(`${outerPath}${innerPath}`);
    rm.abort();
    await once(rm, 'end');
    
    //await writeFile(outerPath, fixtureFile);
    
    t.pass('should abort remove');
    t.end();
});

