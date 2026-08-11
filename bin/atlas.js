#!/usr/bin/env node
'use strict';

require('../src/cli.js')
  .main(process.argv.slice(2))
  .catch((err) => {
    console.error(`error: ${err.message}`);
    process.exit(1);
  });
