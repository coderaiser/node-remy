#!/usr/bin/env node

'use strict';

const remy = require('..');
const glob = require('glob');
const args = process.argv.slice(2);
const arg = args[0];

if (/^-(v|-version)$/.test(arg))
    version();
else if (!arg ||  /^-(h|-help)$/.test(arg))
    help();
else
    glob(arg, (error, files) => {
        const name = files[0];
        
        if (!name)
            error = Error('file not found');
        
        if (error)
            return console.error(error.message);
        
        main(name);
    });
   
function main(name) {
    const rm = remy(name);
    
    rm.on('error', (error) => {
        console.error(error.message);
        rm.continue();
    });
    
    rm.on('progress', (percent) => {
        process.stdout.write(`\r${percent}%`);
    });
    
    rm.on('end', () => {
        process.stdout.write('\n');
    });
}

function version() {
    console.log(`v${info().version}`);
}

function info() {
    return require('../package');
}

function help() {
    const bin = require('../json/bin');
    const usage = `Usage: ${info().name} [path]`;
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        const line = `  ${name} ${bin[name]}`;
        console.log(line);
    });
}
