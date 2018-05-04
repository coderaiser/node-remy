'use strict';

const test = require('tape');
const remy = require('..');

const os = require('os');
const path = require('path');
const fs = require('fs');

test('remy: no args', (t) => {
    t.throws(remy, /from should be a string!/, 'should throw when no args');
    t.end();
});

test('remy: no files', (t) => {
    const fn = () => remy('/hello', '/world');
    t.throws(fn, /files should be an array!/, 'should throw when no args');
    t.end();
});

test('file: error EACESS', (t) => {
    const rm = remy('/bin', [
        'ls'
    ]);
    
    rm.on('error', (error) => {
        t.equal(error.code, 'EACCES', error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('directory: error EACESS', (t) => {
    const rm = remy('/', [
        'bin'
    ]);
    
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
    const {rmdir} = fs;
    const dir = os.tmpdir();
    const name = String(Math.random());
    const full = path.join(dir, name);
     
    fs.mkdirSync(full);
    
    fs.rmdir = (name, callback) => {
        const error = Error('Some error');
        
        error.code = code;
        
        callback(error);
    };
    
    const rm = remy(dir, [
        name,
    ]);
    
    rm.on('error', (error) => {
        t.equal(error.code, code, error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        fs.rmdir = rmdir;
        fs.rmdirSync(full);
        t.end();
    });
});

test('file: no errors', (t) => {
    const name = String(Math.random());
    const dir = '/tmp';
    const full = path.join(dir, name);
    
    fs.writeFileSync(full, 'hello world');
    
    const rm = remy(dir, [name]);
    
    rm.on('end', () => {
        t.pass('should remove file');
        t.end();
    });
});

test('directory: no errors', (t) => {
    const name = String(Math.random());
    const dir = '/tmp';
    const full = path.join(dir, name);
    
    fs.mkdirSync(full);
    
    const rm = remy(dir, [name]);
    
    rm.on('end', () => {
        t.end();
    });
});

test('pause/continue', (t) => {
    const name = String(Math.random());
    const dir = '/tmp';
    const full = path.join(dir, name);
    
    fs.writeFileSync(full, 'hello world');
    
    const rm = remy('/tmp', [name]);
    
    rm.pause();
    
    t.ok(rm._pause, 'pause good');
    
    rm.continue();
    t.notOk(rm._pause, 'continue good');
    
    rm.on('end', () => {
        t.end();
    });
});

test('file: find error', (t) => {
    const dir = '/tmp';
    const name = String(Math.random());
    const code = 'SOME';
    const lstat = fs.lstat;
    
    fs.lstat = (name, fn) => {
        const error = Error('Some error');
        
        error.code = code;
        
        process.nextTick(() => {
            fn(error);
        });
    };
    
    const rm = remy(dir, [name]);
    
    rm.on('error', (error) => {
        fs.lstat = lstat;
        
        t.equal(error.code, 'ENOENT', error);
        t.end();
    });
});

test('remy: _progress', (t) => {
    const dir = '/tmp';
    const name = String(Math.random());
    const full = path.join(dir, name);
    
    fs.writeFileSync(full, 'hello world');
    
    const rm = remy(dir, [name]);
    
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

