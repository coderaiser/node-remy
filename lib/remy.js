'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const findit = require('findit');
const assert = require('assert');
const rimraf = require('rimraf');
const Emitter = require('events').EventEmitter;

util.inherits(Remy, Emitter);

module.exports = (from, files) => {
    assert(typeof from === 'string', 'from should be string!');
    
    if (!files) {
        files   = [
            path.basename(from)
        ];
        
        from = path.dirname(from);
    }
    
    const emitter = new Remy(from, files);
    
    return emitter;
};

function Remy(from, files) {
    this._i             = 0;
    this._files         = [];
    this._dirs          = [];
    
    this._percent       = 0;
    this._percentPrev   = 0;
    
    this._parallel(from, files, () => {
        const filesCount = this._files.length;
        const dirsCount  = this._dirs.length;
        
        this._n = filesCount + dirsCount;
        
        this._rmAll();
    });
}

Remy.prototype._parallel  = function(from, files, callback) {
    let i = files.length;
    const fn = () => {
        if (!--i)
            callback();
    };
    
    files.forEach((name) => {
        const full = path.join(from, name);
        
        this._findFiles(full, fn);
    });
};

Remy.prototype.continue = function() {
    this._pause = false;
    this._rmAll();
};

Remy.prototype.pause = function() {
    this._pause = true;
};

Remy.prototype.abort = function() {
    this._files = [];
    this._dirs  = [];
    
    this._rmAll();
};

Remy.prototype._rmAll = function() {
    let rmFn = this._rmOneFile;
    let name = this._files.shift();
    
    ++this._i;
    
    if (!name) {
        name = this._dirs.shift();
        rmFn = this._rmOneDir;
    }
    
    if (!name)
        return this.emit('end');
    
    const rmEmitter = rmFn(name);
    
    rmEmitter.on('error', (error) => {
        this._progress();
        this.emit('error', error);
    });
    
    rmEmitter.on('end', () => {
        this._progress();
        
        this.emit('file', name);
        
        if (!this._pause)
            this._rmAll();
    });
};

Remy.prototype._findFiles = function(filename, fn) {
    const finder = findit(filename);
    
    const onError = (error) => {
        this._files.push(error.path);
    };
    
    const onFile = (name) => {
        this._files.push(name);
    };
    
    const onDir = (name) => {
        this._dirs.push(name);
    };
    
    finder.on('file', onFile);
    finder.on('error', onError);
    finder.on('directory', onDir);
    finder.on('link', onFile);
    finder.on('end', fn);
};

Remy.prototype._rmOneFile = function(name) {
    const emitter = new Emitter();
    
    fs.unlink(name, (error) => {
        if (error)
            return emitter.emit('error', error);
        
        emitter.emit('end');
    });
    
    return emitter;
};

Remy.prototype._rmOneDir = function(name) {
    const emitter = new Emitter();
    
    rimraf(name, (error) => {
        if (error && error.code !== 'ENOENT')
            return emitter.emit('error', error);
        
        emitter.emit('end');
    });
    
    return emitter;
};

Remy.prototype._progress = function() {
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value === this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

