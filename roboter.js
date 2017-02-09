'use strict';

const roboter = require('roboter');

// dummy require to avoid an unused dependencies error
require('eslint-config-seal');

roboter.
  workOn('server').
  equipWith((task) => {
    task('universal/analyze', {
      src: ['**/*.js', '!node_modules/**/*.js', '!examples/**', '!coverage/**', '!temp/**', '!output/**'],
      rules: '.eslintrc'
    });
    task('universal/test-units', {
      src: 'test/**/*Test.js'
    });
  }).
  start();
