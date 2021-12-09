/* eslint no-process-exit: off, no-console: off */
// import Launcher, { RunCommandArguments } from '@wdio/cli';
import SpectronWorkerService from 'wdio-electron-service';
import { Services } from '@wdio/types';
import { join } from 'path';

type SpectronConfig = {
  config: {
    spectronOpts: {
      appPath: string;
      appName: string;
      logFileName: string;
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

function stripSpectronOpts(config: SpectronConfig['config']) {
  const filteredEntries = Object.entries(config).filter((configEntry: unknown[]) => configEntry[0] !== 'spectronOpts');

  return Object.fromEntries(filteredEntries);
}

function buildLauncherConfig(
  config: SpectronConfig['config'],
  chromedriverCustomPath: string,
  spectronOpts: SpectronConfig['config']['spectronOpts'],
  chromeArgs: string[],
): WebdriverIO.Config {
  const { appPath, appName, logFileName = 'wdio-chromedriver.log' } = spectronOpts;
  const filteredConfig = stripSpectronOpts(config);
  return {
    ...filteredConfig,
    services: [
      [
        SpectronWorkerService as Services.ServiceClass,
        {
          port: filteredConfig.port,
          logFileName,
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

export const run = (config: SpectronConfig['config']): WebdriverIO.Config => {
  const chromeArgs = [];
  const isWin = process.platform === 'win32';

  if (process.env.CI) {
    chromeArgs.push('window-size=1280,800');
    chromeArgs.push('blink-settings=imagesEnabled=false');
    chromeArgs.push('enable-automation');
    chromeArgs.push('disable-infobars');
    chromeArgs.push('disable-extensions');
    if (!isWin) {
      // chromeArgs.push('headless'); - crashes on linux with xvfb
      chromeArgs.push('no-sandbox');
      chromeArgs.push('disable-gpu');
      chromeArgs.push('disable-dev-shm-usage');
      chromeArgs.push('disable-setuid-sandbox');
      // chromeArgs.push('remote-debugging-port=9222');
    }
  }

  if (isWin) {
    process.env.SPECTRON_NODE_PATH = process.execPath;
    process.env.SPECTRON_CHROMEDRIVER_PATH = require.resolve('electron-chromedriver/chromedriver');
  }
  const chromedriverCustomPath = isWin
    ? join(__dirname, '..', 'bin', 'chrome-driver.bat')
    : require.resolve('electron-chromedriver/chromedriver');

  const configFilePath = join(process.cwd(), 'spectron.conf.js');

  // https://github.com/mysticatea/eslint-plugin-node/pull/256
  // const { config }: SpectronConfig = await import(configFilePath); // eslint-disable-line
  const { spectronOpts } = config;

  if (!config) {
    throw new Error(`Unable to read config file: ${configFilePath}`);
  }

  if (process.env.SPECTRON_APP_ARGS) {
    chromeArgs.push(...process.env.SPECTRON_APP_ARGS.split(','));
  }

  return buildLauncherConfig(config, chromedriverCustomPath, spectronOpts, chromeArgs);
  // const wdio = new Launcher(args[2] as string, launcherConfig as Partial<RunCommandArguments>);

  // try {
  //   const exitCode = await wdio.run();
  //   process.exit(exitCode);
  // } catch (error) {
  //   console.error('Launcher failed to start the test', (error as Error).stack);
  // }
};
