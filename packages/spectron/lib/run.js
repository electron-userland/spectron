const Launcher = require('@wdio/cli').default;
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

const run = async (...args) => {
  const chromeArgs = [];

  if (process.env.CI) {
    chromeArgs.push('window-size=1280,800');
    chromeArgs.push('blink-settings=imagesEnabled=false');
    chromeArgs.push('enable-automation');
    chromeArgs.push('disable-infobars');
    chromeArgs.push('disable-extensions');
    if (process.platform !== 'win32') {
      // chromeArgs.push('headless'); - crashes on linux with xvfb
      chromeArgs.push('no-sandbox');
      chromeArgs.push('disable-gpu');
      chromeArgs.push('disable-dev-shm-usage');
      chromeArgs.push('disable-setuid-sandbox');
      // chromeArgs.push('remote-debugging-port=9222');
    }
  }

  const isWin = process.platform === 'win32';
  if (isWin) {
    process.env.SPECTRON_NODE_PATH = process.execPath;
    process.env.SPECTRON_CHROMEDRIVER_PATH = require.resolve('electron-chromedriver/chromedriver');
  }
  const chromedriverCustomPath = isWin
    ? join(__dirname, '..', 'bin', 'chrome-driver.bat')
    : require.resolve('electron-chromedriver/chromedriver');

  // assume default electron-builder output dir for now
  const appPath = getAppPath(join(process.cwd(), 'dist'), process.env.npm_package_build_productName);

  const wdio = new Launcher(args[2], {
    services: [
      [
        'chromedriver',
        {
          port: 9515,
          logFileName: 'wdio-chromedriver.log', // default
          // outputDir: 'driver-logs', // overwrites the config.outputDir
          chromedriverCustomPath,
          // args: ['--silent'],
        },
      ],
    ],
    capabilities: [
      {
        'browserName': 'chrome',
        'goog:chromeOptions': {
          binary: appPath,
          args: chromeArgs,
          windowTypes: ['app', 'webview'],
        },
      },
    ],
  });

  try {
    await wdio.run();
  } catch (error) {
    console.error('Launcher failed to start the test', error.stacktrace);
  }
};

module.exports = {
  run,
};
