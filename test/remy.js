'use strict';

const {once} = require('events');

const os = require('os');
const path = require('path');
const fs = require('fs');

const {reRequire} = require('mock-require');
const test = require('supertape');
const wait = require('@iocmd/wait');
const remy = require('..');

test('remy: no args', (t) => {
    t.throws(remy, /from should be a string!/, 'should throw when no args');
    t.end();
});

test('file: error EACESS', async (t) => {
    const rm = remy('/bin/ls');
    const abort = rm.abort.bind(rm);
    
    const [result] = await Promise.all([
        once(rm, 'error'),
        once(rm, 'end'),
        wait(abort),
    ]);
    
    const [error] = result;
    
    t.equal(error.code, 'EACCES', error.message);
    t.end();
});

test('directory: error EACESS', async (t) => {
    const rm = remy('/bin');
    const abort = rm.abort.bind(rm);
    
    const [result] = await Promise.all([
        once(rm, 'error'),
        once(rm, 'end'),
        wait(abort),
    ]);
    
    const [error] = result;
    
    t.equal(error.code, 'EACCES', error.message);
    t.end();
});

test('directory: error SOME_ERROR', async (t) => {
    const code = 'SOME_ERROR';
    
    const {mkdir, rmdir} = fs.promises;
    
    const name = path.join(os.tmpdir(), String(Math.random()));
    await mkdir(name);
    
    fs.promises.rmdir = async () => {
        const error = Error('Some error');
        error.code = code;
        throw error;
    };
    
    const remy = reRequire('..');
    const rm = remy(name);
    const abort = rm.abort.bind(rm);
    
    const time = 100;
    const [result] = await Promise.all([
        once(rm, 'error'),
        wait(time, abort),
    ]);
    
    const [error] = result;
    
    fs.promises.rmdir = rmdir;
    await rmdir(name);
    
    t.equal(error.code, code, error.message);
    t.end();
});

test('file: no errors', async (t) => {
    const name = path.join('/tmp', String(Math.random()));
    fs.writeFileSync(name, 'hello world');
    const rm = remy(name);
    
    await once(rm, 'end');
    t.pass('no errors');
    t.end();
});

test('directory: no errors', async (t) => {
    const name = path.join('/tmp', String(Math.random()));
    fs.mkdirSync(name);
    const rm = remy(name);
    await once(rm, 'end');
    t.end();
});

test('pause/continue', async (t) => {
    const name = path.join('/tmp', String(Math.random()));
    fs.writeFileSync(name, 'hello world');
    const rm = remy(name);
    
    await Promise.all([
        once(rm, 'file'),
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
    const full1 = path.join('/tmp', name1);
    const full2 = path.join('/tmp', name2);
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
    const name = path.join('/tmp', String(Math.random()));
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
    const name = path.join('/tmp', String(Math.random()));
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

