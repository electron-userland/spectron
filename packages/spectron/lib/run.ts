/* eslint no-process-exit: off, no-console: off */
import Launcher, { RunCommandArguments } from '@wdio/cli';
import { join } from 'path';

type SpectronConfig = {
  config: {
    spectronOpts: {
      appPath: string;
      appName: string;
    };
  };
};

function getBinaryPath(distPath: string, appName: string) {
  const SupportedPlatform = {
    darwin: 'darwin',
    linux: 'linux',
    win32: 'win32',
  };

  if (!Object.values(SupportedPlatform).includes(process.platform)) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }

  const pathMap = {
    darwin: `mac/${appName}.app/Contents/MacOS/${appName}`,
    linux: `linux-unpacked/${appName}`,
    win32: `win-unpacked/${appName}.exe`,
  };

  const electronPath = pathMap[process.platform as keyof typeof SupportedPlatform];

  return `${distPath}/${electronPath}`;
}

function buildLauncherConfig(chromedriverCustomPath: string, appPath: string, appName: string, chromeArgs: string[]) {
  return {
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
          binary: getBinaryPath(appPath, appName),
          args: chromeArgs,
          windowTypes: ['app', 'webview'],
        },
      },
    ],
  };
}

export const run = async (...args: unknown[]): Promise<void> => {
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

  const configFilePath = join(process.cwd(), 'spectron.conf.js');

  // https://github.com/mysticatea/eslint-plugin-node/pull/256
  const { config }: SpectronConfig = await import(configFilePath); // eslint-disable-line
  const {
    spectronOpts: { appPath, appName },
  } = config;

  if (!config) {
    throw new Error(`Unable to read config file: ${configFilePath}`);
  }

  if (process.env.SPECTRON_APP_ARGS) {
    chromeArgs.push(...process.env.SPECTRON_APP_ARGS.split(','));
  }

  const launcherConfig = buildLauncherConfig(chromedriverCustomPath, appPath, appName, chromeArgs);
  const wdio = new Launcher(args[2] as string, launcherConfig as Partial<RunCommandArguments>);

  try {
    const exitCode = await wdio.run();
    process.exit(exitCode);
  } catch (error) {
    console.error('Launcher failed to start the test', (error as Error).stack);
  }
};
