const { initSpectron } = require(`${process.env ? './dist' : './'}lib/application`);
const { run } = require('./lib/run');

module.exports = { initSpectron, run };
