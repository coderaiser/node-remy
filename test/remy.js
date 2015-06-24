(function() {
    'use strict';
    
    var test        = require('tape'),
        remimitter  = require('..');
    
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
})();
