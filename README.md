# Remy [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Remove files with emitter (also in `zip` packages).

## Global

`remy` can be installed globally with

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

`Remy` can be used localy. It will emit event on every copied file.
Good for making progress bars.

### Install

```
npm i remy --save
```

### How to use?

#### remy(from[, names])

- `from` - path to directory with files or directories to remove
- `names` - `array` of file names (optional)

```js
const remy = require('remy');
const cwd = process.cwd();
const abortOnError = false;

const rm = remy(cwd, ['LICENSE', 'README.md', 'package.json']);

rm.on('file', (name) => {
    console.log(name);
});

rm.on('directory', (name) => {
    console.log(name);
});

rm.on('progress', (percent) => {
    console.log(percent);
    
    if (percent >= 50) {
        rm.pause();
        rm.continue();
    }
});

rm.on('error', (error) => {
    rm.continue();
});

rm.on('end', () => {
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

## Related

- [Copymitter](https://github.com/coderaiser/node-copymitter "Copymitter") - Copy files with emitter.
- [Jaguar](https://github.com/coderaiser/node-jaguar "Jaguar") - Pack and extract .tar.gz archives with emitter.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.
- [Tar-to-zip](https://github.com/coderaiser/node-tar-to-zip "tar-to-zip") - Convert tar and tar.gz archives to zip.

## License

MIT

[NPMIMGURL]: https://img.shields.io/npm/v/remy.svg?style=flat
[BuildStatusURL]: https://github.com/coderaiser/node-remy/actions?query=workflow%3A%22Node+CI%22 "Build Status"
[BuildStatusIMGURL]: https://github.com/coderaiser/node-remy/workflows/Node%20CI/badge.svg
[LicenseIMGURL]: https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[CoverageIMGURL]: https://coveralls.io/repos/coderaiser/node-remy/badge.svg?branch=master&service=github
[NPMURL]: https://npmjs.org/package/remy "npm"
[LicenseURL]: https://tldrlegal.com/license/mit-license "MIT License"
[CoverageURL]: https://coveralls.io/github/coderaiser/node-remy?branch=master
