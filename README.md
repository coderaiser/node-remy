# Rummy [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]

Remove files with emitter.

## Global

`Rummy` could be installed global with

```
npm i rummy -g
```
And used this way:

```
Usage: rummy [path]
Options:
  -h, --help      display this help and exit
  -v, --version   output version information and exit
```

## Local

`Rummy` could be used localy. It will emit event on every copied file.
Good for making progress bars.

### Install

```
npm i rummy --save
```

### How to use?
Rummy could be called with one or two arguments: `rummy(path[, files])`.

```js
var rummy           = require('rummy'),
    cwd             = process.cwd(),
    abortOnError    = false;
    
rm = rummy(cwd, [
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

rm.on('error', function(error, name, i, percent) {
    console.error(percent, ' -> ', name, ':', error.message);
    
    if (abortOnError)
        rm.abort();
    else
        rm.continue();
});

rm.on('end', function() {
    console.log('Copying ended up');
});
```

In case of starting example output should be similar to:

```
33%
67%
100%
Copying ended up
```

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/rummy.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-rummy/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/node-rummy.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/rummy "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-rummy  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/node-rummy "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

