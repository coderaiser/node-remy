'use strict';

const test = require('tape');
const remy = require('..');

const os = require('os');
const path = require('path');
const fs = require('fs');

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

test('folder: error EACESS', (t) => {
    const rm = remy('/bin');
    
    rm.on('error', (error) => {
        t.equal(error.code, 'EACCES', error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        t.end();
    });
});

test('folder: error SOME_ERROR', (t) => {
    const code = 'SOME_ERROR';
    const rmdir = fs.rmdir;
    const name = path.join(os.tmpdir(), String(Math.random()));
     
    fs.mkdirSync(name);
    
    fs.rmdir = (name, callback) => {
        const error = Error('Some error');
        
        error.code  = code;
        
        callback(error);
    };
    
    const rm = remy(name);
    
    rm.on('error', (error) => {
        t.equal(error.code, code, error.message);
        rm.abort();
    });
    
    rm.on('end', () => {
        fs.rmdir = rmdir;
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

test('folder: no errors', (t) => {
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
    
    rm.pause();
    
    t.ok(rm._pause, 'pause good');
    
    rm.continue();
    t.notOk(rm._pause, 'continue good');
    
    rm.on('end', () => {
        t.end();
    });
});

test('file: find error', (t) => {
    const name = path.join('/tmp', String(Math.random()));
    const code = 'SOME';
    const lstat = fs.lstat;
    
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

