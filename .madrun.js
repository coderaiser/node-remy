'use strict';

const {run, cutEnv} = require('madrun');

const env = {
    SUPERTAPE_CHECK_ASSERTIONS_COUNT: 0,
};

module.exports = {
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
    'test': () => [env, 'tape test/*.js'],
    'coverage': async () => [env, `c8 ${await cutEnv('test')}`],
    'report': () => 'c8 report --reporter=text-lcov | coveralls',
    'watch:coverage': () => run('watcher', 'npm run coverage'),
    'watch:test': () => run('watcher', 'npm test'),
    'watcher': () => 'nodemon -w test -w lib --exec',
};
