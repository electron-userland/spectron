const { join } = require('path');

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

const config = {
  // process.env.npm_package_build_productName
  appPath: getAppPath(join(process.cwd(), 'app', 'dist'), 'test'),
};

module.exports = { config };
