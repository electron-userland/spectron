/* eslint no-process-exit: off, no-console: off */
// import Launcher, { RunCommandArguments } from '@wdio/cli';
import ElectronWorkerService from 'wdio-electron-service';
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

function stripSpectronOpts(config: SpectronConfig['config']) {
  const filteredEntries = Object.entries(config).filter((configEntry: unknown[]) => configEntry[0] !== 'spectronOpts');

  return Object.fromEntries(filteredEntries);
}

function buildLauncherConfig(
  config: SpectronConfig['config'],
  chromedriverCustomPath: string,
  spectronOpts: SpectronConfig['config']['spectronOpts'],
): WebdriverIO.Config {
  const { appPath, appName, logFileName = 'wdio-chromedriver.log' } = spectronOpts;
  const filteredConfig = stripSpectronOpts(config);
  return {
    ...filteredConfig,
    services: [
      [
        ElectronWorkerService as Services.ServiceClass,
        {
          appPath,
          appName,
          logFileName,
          // args: ['--silent'],
        },
      ],
      [
        'chromedriver',
        {
          port: filteredConfig.port,
          logFileName,
          chromedriverCustomPath,
          // args: ['--silent'],
        },
      ],
    ],
    capabilities: [{}],
  };
}

export const run = (config: SpectronConfig['config']): WebdriverIO.Config => {
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
  // const { config }: SpectronConfig = await import(configFilePath); // eslint-disable-line
  const { spectronOpts } = config;

  if (!config) {
    throw new Error(`Unable to read config file: ${configFilePath}`);
  }

  return buildLauncherConfig(config, chromedriverCustomPath, spectronOpts);
};
