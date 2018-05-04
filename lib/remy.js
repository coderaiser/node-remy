'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const findit = require('findit2');
const assert = require('assert');
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
    
    return new Remy(from, files);
};

function Remy(from, files) {
    this._i             = 0;
    this._files         = [];
    
    this._percent       = 0;
    this._percentPrev   = 0;
    
    this._parallel(from, files, () => {
        const filesCount = this._files.length;
        
        this._n = filesCount;
        
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
    this._rmAll();
};

Remy.prototype._rmAll = function() {
    const name = this._files.pop();
    
    if (!name)
        return this.emit('end');
    
    const rmEmitter = this._rmOneFile(name);
    
    rmEmitter.on('error', (error) => {
        this._progress();
        this.emit('error', error);
    });
    
    rmEmitter.on('end', () => {
        this._progress();
        
        if (!this._pause)
            this._rmAll();
    });
};

Remy.prototype._findFiles = function(filename, fn) {
    const _fs = {
        lstat: fs.stat,
        readdir: fs.readdir,
    };
    
    const finder = findit(filename, {fs: _fs});
    
    const onError = (error) => {
        this._files.push(error.path);
    };
    
    const onFile = (name) => {
        this._files.push(name);
    };
    
    finder.on('file', onFile);
    finder.on('directory', onFile);
    finder.on('error', onError);
    finder.on('link', onFile);
    finder.on('end', fn);
};

Remy.prototype._rmOneFile = function(name) {
    const emitter = new Emitter();
    
    fs.unlink(name, (error) => {
        if (!error) {
            this.emit('file', name);
            return emitter.emit('end');
        }
         
        if (error && error.code === 'EISDIR')
            return rmOneDir(this, emitter, name);
        
        return emitter.emit('error', error);
        
    });
    
    return emitter;
};

const rmOneDir = (rm, emitter, name) => {
    fs.rmdir(name, (error) => {
        if (error)
            emitter.emit('error', error);
        
        emitter.emit('end');
        emitter.emit('directory', name);
    });
};

Remy.prototype._progress = function() {
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value === this._percentPrev)
        return;
        
    this._percentPrev = value;
    this.emit('progress', value);
};

