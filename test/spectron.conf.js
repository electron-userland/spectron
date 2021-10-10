const { join } = require('path');
const fs = require('fs-extra');

process.env.SPECTRON_APP_ARGS = ['--foo', '--bar=baz'].toString();

const packageJson = JSON.parse(fs.readFileSync('./app/package.json'));
const {
  build: { productName },
} = packageJson;

const config = {
  appPath: join(process.cwd(), 'app', 'dist'),
  appName: productName,
};

module.exports = { config };
