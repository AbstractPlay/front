const merge = require('lodash/merge');
const global = require('./global');

var env; // let doesn't seem to work here
if (process.env.NODE_ENV === 'local') {
    env = require('./local');
} else if (process.env.NODE_ENV === 'development') {
    env = require('./dev');
} else {
    env = require('./prod');
}

module.exports = merge(global, env);
