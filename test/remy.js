'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

const {reRequire} = require('mock-require');
const tryCatch = require('try-catch');
const test = require('supertape');
const remy = require('..');

test('remy: no args', (t) => {
    t.throws(remy, /from should be a string!/, 'should throw when no args');
    t.end();
});

test('file: error EACESS', (t) => {
    const rm = remy('/bin/ls');
    
    rm.on('error', (error) => {
        t.equal(error.code, 'EACCES', error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('directory: error EACESS', (t) => {
    const rm = remy('/bin');
    
    rm.on('error', (error) => {
        t.equal(error.code, 'EACCES', error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('directory: error SOME_ERROR', (t) => {
    const code = 'SOME_ERROR';
    const {rmdir} = fs.promises;
    const name = path.join(os.tmpdir(), String(Math.random()));
    
    fs.mkdirSync(name);
    
    fs.promises.rmdir = async () => {
        const error = Error('Some error');
        error.code = code;
        throw error;
    };
    
    const remy = reRequire('..');
    const rm = remy(name);
    
    rm.on('error', (error) => {
        t.equal(error.code, code, error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        fs.promises.rmdir = rmdir;
        fs.rmdirSync(name);
        t.end();
    });
});

test('file: no errors', (t) => {
    const name = path.join('/tmp', String(Math.random()));
    
    fs.writeFileSync(name, 'hello world');
    
    const rm = remy(name);
    
    rm.on('end', () => {
        t.end();
    });
});

test('directory: no errors', (t) => {
    const name = path.join('/tmp', String(Math.random()));
    
    fs.mkdirSync(name);
    
    const rm = remy(name);
    
    rm.on('end', () => {
        t.end();
    });
});

test('pause/continue', (t) => {
    const name = path.join('/tmp', String(Math.random()));
    
    fs.writeFileSync(name, 'hello world');
    
    const rm = remy(name);
    
    rm.on('file', () => {
        rm.pause();
        t.ok(rm._pause, 'pause good');
        
        rm.continue();
        t.notOk(rm._pause, 'continue good');
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('pause/continue: couple files', (t) => {
    const name1 = String(Math.random());
    const name2 = String(Math.random());
    
    const full1 = path.join('/tmp', name1);
    const full2 = path.join('/tmp', name2);
    
    fs.writeFileSync(full1, 'hello world1');
    fs.writeFileSync(full2, 'hello world2');
    
    const rm = remy('/tmp', [
        name1,
        name2,
    ]);
    
    rm.once('file', () => {
        rm.pause();
        t.ok(rm._pause, 'pause good');
        
        process.nextTick(() => {
            rm.continue();
            t.notOk(rm._pause, 'continue good');
        });
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('file: find error', (t) => {
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
    
    rm.on('error', (error) => {
        fs.lstat = lstat;
        
        t.equal(error.code, 'ENOENT', error);
        t.end();
    });
});

test('remy: _progress', (t) => {
    const name = path.join('/tmp', String(Math.random()));
    
    fs.writeFileSync(name, 'hello world');
    
    const rm = remy(name);
    
    rm.pause();
    rm._n = 1;
    rm._progress();
    rm._percentPrev = 200;
    rm._progress();
    rm.continue();
    
    rm.on('progress', (n) => {
        t.equal(n, 300, 'should emit progress once');
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('remy: EPERM', (t) => {
    const name = path.join(os.tmpdir(), String(Math.random()));
    fs.mkdirSync(name);
    
    const {unlink} = fs;
    
    fs.unlink = (a, fn) => {
        const e = Error('EPERM: operation not permitted, unlink \'/tmp/1\'');
        e.code = 'EPERM';
        
        fn(e);
    };
    
    const rm = remy(name);
    
    rm.on('error', (e) => {
        fs.rmdirSync(name);
        fs.unlink = unlink;
        
        t.fail(e.message);
        t.end();
    });
    
    rm.on('end', () => {
        fs.unlink = unlink;
        t.pass('should catch EPERM');
        
        const [e] = tryCatch(fs.statSync, name);
        
        t.ok(e, 'should remove directory');
        t.end();
    });
});

