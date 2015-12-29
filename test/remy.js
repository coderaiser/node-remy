(function() {
    'use strict';
    
    var test        = require('tape'),
        remimitter  = require('..'),
         
        os          = require('os'),
        path        = require('path'), 
        fs          = require('fs');
    
    test('file: error EACESS', function(t) {
        var rm = remimitter('/bin/ls');
        
        rm.on('error', function(error) {
            t.equal(error.code, 'EACCES', error.message);
            rm.abort();
        });
        
        rm.on('end', function() {
            t.end();
        });
    });
    
    test('folder: error EACESS', function(t) {
        var rm = remimitter('/bin');
        
        rm.on('error', function(error) {
            t.equal(error.code, 'EACCES', error.message);
            rm.abort();
        });
        
        rm.on('end', function() {
            t.end();
        });
    });
    
    test('folder: error SOME_ERROR', function(t) {
        var rm,
            code    = 'SOME_ERROR',
            rmdir   = fs.rmdir,
            name    = path.join(os.tmpdir(), String(Math.random()));
         
        fs.mkdirSync(name);
        
        fs.rmdir = function(name, callback) {
            var error   = Error('Some error');
            error.code  = code;
            
            callback(error);
        };
        
        rm = remimitter(name);
        
        rm.on('error', function(error) {
            t.equal(error.code, code, error.message);
            rm.abort();
        });
        
        rm.on('end', function() {
            fs.rmdir = rmdir;
            fs.rmdirSync(name);
            t.end();
        });
    });
})();
