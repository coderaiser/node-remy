'use strict';

const {run} = require('madrun');

module.exports = {
    'lint': () => 'putout bin lib test .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
    'test': () => 'tape test/*.js',
    'coverage': () => 'nyc npm test',
    'report': () => 'nyc report --reporter=text-lcov | coveralls',
    'watch:coverage': () => run('watcher', 'npm run coverage'),
    'watch:test': () => run('watcher', 'npm test'),
    'watcher': () => 'nodemon -w test -w lib --exec',
};

