const { join } = require('path');
const fs = require('fs-extra');

function getAppPath(distPath: string, appName: string) {
  enum SupportedPlatform {
    darwin = 'darwin',
    linux = 'linux',
    win32 = 'win32',
  }

  if (!Object.values(SupportedPlatform).includes(process.platform as SupportedPlatform)) {
    throw new Error('unsupported platform');
  }
  const pathMap = {
    darwin: `mac/${appName}.app/Contents/MacOS/${appName}`,
    linux: `linux-unpacked/${appName}`,
    win32: `win-unpacked/${appName}.exe`,
  };

  return `${distPath}/${pathMap[process.platform as SupportedPlatform]}`;
}

const appPath = getAppPath(join(process.cwd(), 'dist'), 'test');
const args = [];

if (process.env.CI) {
  args.push('window-size=1280,800');
  args.push('blink-settings=imagesEnabled=false');
  args.push('enable-automation');
  args.push('disable-infobars');
  args.push('disable-extensions');
  if (process.platform !== 'win32') {
    // args.push('headless'); - crashes on linux with xvfb
    args.push('no-sandbox');
    args.push('disable-gpu');
    args.push('disable-dev-shm-usage');
    args.push('disable-setuid-sandbox');
    // args.push('remote-debugging-port=9222');
  }
}

if (process.platform === 'win32') {
  process.env.SPECTRON_NODE_PATH = process.execPath;
  process.env.SPECTRON_CHROMEDRIVER_PATH = require.resolve('electron-chromedriver/chromedriver');
}
const isWin = process.platform === 'win32';
const chromedriverCustomPath = isWin
  ? join(__dirname, '..', 'packages', 'spectron', 'lib', 'chrome-driver.bat')
  : require.resolve('electron-chromedriver/chromedriver');

const config = {
  // hostname: '127.0.0.1',
  port: 9515,
  waitforTimeout: 5000,
  connectionRetryCount: 10,
  connectionRetryTimeout: 30000,
  logLevel: 'debug',
  runner: 'local',
  // outputDir: 'all-logs',
  specs: ['./*.spec.ts'],
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
        args,
        windowTypes: ['app', 'webview'],
      },
    },
  ],
  autoCompileOpts: {
    autoCompile: true,
    // see https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
    // for all available options
    tsNodeOpts: {
      transpileOnly: true,
      project: './tsconfig.json',
    },
    // tsconfig-paths is only used if "tsConfigPathsOpts" are provided, if you
    // do please make sure "tsconfig-paths" is installed as dependency
    tsConfigPathsOpts: {
      baseUrl: './',
    },
  },
  framework: 'jasmine',
  jasmineNodeOpts: {
    //
    // Jasmine default timeout
    defaultTimeoutInterval: 30000,
    //
    // Make use of Jasmine-specific grep functionality
    grep: null,
    invertGrep: null,
  },
};

module.exports = { config };
