const { join } = require('path');
const fs = require('fs-extra');

function getAppPath(distPath, appName) {
  const SupportedPlatform = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'win32',
  };

  if (!Object.values(SupportedPlatform).includes(process.platform)) {
    throw new Error('unsupported platform');
  }
  const pathMap = {
    darwin: `mac/${appName}.app/Contents/MacOS/${appName}`,
    linux: `linux-unpacked/${appName}`,
    win32: `win-unpacked/${appName}.exe`,
  };

  return `${distPath}/${pathMap[process.platform]}`;
}

process.env.SPECTRON_APP_ARGS = ['--foo', '--bar=baz'].toString();

const packageJson = JSON.parse(fs.readFileSync('./app/package.json'));
const {
  build: { productName },
} = packageJson;

const config = {
  appPath: getAppPath(join(process.cwd(), 'app', 'dist'), productName),
};

module.exports = { config };
