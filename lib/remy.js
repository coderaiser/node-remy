'use strict';

const path = require('path');
const {EventEmitter} = require('events');
const fs = require('fs');
const {
    inherits,
    promisify,
} = require('util');

const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const findit = require('findit2');
const tryToCatch = require('try-to-catch');

inherits(Remy, EventEmitter);

module.exports = (from, names) => {
    check(from);
    
    if (!names) {
        names = [
            path.basename(from)
        ];
        
        from = path.dirname(from);
    }
    
    return new Remy(from, names);
};

function Remy(from, files) {
    this._i             = 0;
    this._files         = [];
    
    this._percent       = 0;
    this._percentPrev   = 0;
    
    const onError = (e) => this.emit('error', e);
    
    process.nextTick(() => {
        this._start(from, files)
            .catch(onError);
    });
}

Remy.prototype._start = async function(from, files) {
    await this._parallel(from, files);
    
    this._n = this._files.length;
    
    await this._rmAll();
};

Remy.prototype._parallel = async function(from, files) {
    const promises = [];
    
    for (const name of files) {
        const full = path.join(from, name);
        promises.push(this._findFiles(full));
    }
    
    return Promise.all(promises);
};

Remy.prototype.continue = function() {
    this._pause = false;
    
    if (!this._files.length)
        return;
    
    this._rmAll();
};

Remy.prototype.pause = function() {
    this._pause = true;
};

Remy.prototype.abort = function() {
    this._files = [];
    this._rmAll();
};

Remy.prototype._rmAll = async function() {
    const name = this._files.pop();
    
    if (!name)
        return this.emit('end');
    
    const [error, type] = await tryToCatch(rmOneFile, name);
    
    this._progress();
    
    if (error)
        return this.emit('error', error);
    
    this.emit(type, name);
    
    if (this._pause)
        return;
    
    return this._rmAll();
};

Remy.prototype._findFiles = promisify(function(filename, fn) {
    const finder = findit(filename);
    
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
});

async function rmOneFile(name) {
    const [error] = await tryToCatch(unlink, name);
    
    if (!error)
        return 'file';
    
    if (error && /EPERM|EISDIR/.test(error.code))
        return rmOneDir(name);
    
    throw error;
}

async function rmOneDir(name) {
    await rmdir(name);
    return 'directory';
}

Remy.prototype._progress = function() {
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value === this._percentPrev)
        return;
    
    this._percentPrev = value;
    this.emit('progress', value);
};

function check(from) {
    if (typeof from !== 'string')
        throw Error('from should be a string!');
}

