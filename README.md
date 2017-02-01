# Remy [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Remove files with emitter.

## Global

`remy` could be installed global with

```
npm i remy -g
```
And used this way:

```
Usage: remy [path]
Options:
  -h, --help      display this help and exit
  -v, --version   output version information and exit
```

## Local

`Remy` could be used localy. It will emit event on every copied file.
Good for making progress bars.

### Install

```
npm i rummy --save
```

### How to use?
`Remy` could be called with one or two arguments: `remy(path[, files])`.

```js
const remy = require('remy');
const cwd = process.cwd();
const abortOnError = false;

const rm = remy(cwd, [
    'LICENSE',
    'README.md',
    'package.json'
]);

rm.on('file', function(name) {
    console.log(name);
});

rm.on('progress', function(percent) {
    console.log(percent);
    
    if (percent >= 50) {
        rm.pause();
        rm.continue();
    }
});

rm.on('error', function(error,) {
    if (abortOnError)
        rm.abort();
    else
        rm.continue();
});

rm.on('end', function() {
    console.log('Removing ended up');
});
```

In case of starting example output should be similar to:

```
33%
67%
100%
Removing ended up
```

## Environments

In old `node.js` environments that supports `es5` only, `remy` could be used with:

```js
var remy = require('remy/legacy');
```

## Related

- [Copymitter](https://github.com/coderaiser/node-copymitter "Copymitter") - Copy files with emitter.
- [Jaguar](https://github.com/coderaiser/node-jaguar "Jaguar") - Pack and extract .tar.gz archives with emitter.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.
- [Tar-to-zip](https://github.com/coderaiser/node-tar-to-zip "tar-to-zip") - Convert tar and tar.gz archives to zip.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/remy.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-remy/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/node-remy.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-remy/badge.svg?branch=master&service=github
[NPMURL]:                   https://npmjs.org/package/remy "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-remy  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/node-remy "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"
[CoverageURL]:              https://coveralls.io/github/coderaiser/node-remy?branch=master
