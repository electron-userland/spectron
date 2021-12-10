import path from 'path';
import { path as chromedriverPath } from 'chromedriver';
import { remote } from 'webdriverio';
import { Capabilities, Options, Services, Frameworks } from '@wdio/types';
import { SpectronClient } from '~/common/types';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export type ChromeOptions = {
  binary: string;
  args: string[];
  windowTypes: ['app', 'webview'];
};

// export type Capabilities = {
//   'browserName': 'chrome';
//   'goog:chromeOptions': ChromeOptions;
// };

export type Config = {
  outputDir: string;
};

export default class ElectronWorkerService implements Services.ServiceInstance {
  constructor(
    options: Services.ServiceOption,
    caps: Capabilities.Capabilities,
    config: Omit<Options.Testrunner, 'capabilities'>,
  ) {
    this.options = options;
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
    caps.browserName = 'chrome';
    caps['goog:chromeOptions'] = {
      binary: getBinaryPath(options.appPath, options.appName),
      args: chromeArgs,
      windowTypes: ['app', 'webview'],
    };
    this.wdOpts = {
      // protocol: options.protocol || DEFAULT_CONNECTION.protocol,
      // hostname: options.hostname || DEFAULT_CONNECTION.hostname,
      // port: options.port || DEFAULT_CONNECTION.port,
      // path: options.path || DEFAULT_CONNECTION.path,
      capabilities: caps,
    };

    this.outputDir = config.outputDir;
    this.chromedriverCustomPath = options.chromedriverCustomPath
      ? path.resolve(options.chromedriverCustomPath)
      : chromedriverPath;
    console.log('constructor end', this.wdOpts);
  }

  public options;

  public wdOpts;

  public browser?: SpectronClient;

  public outputDir;

  public chromedriverCustomPath;

  onWorkerStart(
    cid: string,
    capabilities: Capabilities.DesiredCapabilities,
    specs: string[],
    args: Options.Testrunner,
    execArgv: string[],
  ): void {
    console.log('zOMG onworkerStart', cid);
  }

  beforeSession(
    config: Omit<Options.Testrunner, 'capabilities'>,
    capabilities: Capabilities.Capabilities,
    specs: string[],
    cid: string,
  ): void {
    console.log('beforesession yo');
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

    if (process.env.SPECTRON_APP_ARGS) {
      chromeArgs.push(...process.env.SPECTRON_APP_ARGS.split(','));
    }

    const { appPath, appName } = this.options;

    capabilities.browserName = 'chrome';
    capabilities['goog:chromeOptions'] = {
      binary: getBinaryPath(appPath, appName),
      args: chromeArgs,
      windowTypes: ['app', 'webview'],
    };

    // set capabilities
    // this.browser = browser;
  }

  async afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult): Promise<void> {
    await this.browser?.exitElectronApp();
    await delay(1000);
    await remote(this.wdOpts);
  }

  async after(result: number, capabilities: Capabilities.RemoteCapability, specs: string[]): Promise<void> {
    console.log('after');
  }

  async onComplete(
    exitCode: number,
    config: Omit<Options.Testrunner, 'capabilities'>,
    capabilities: Capabilities.RemoteCapabilities,
    results: any,
  ): Promise<void> {
    console.log('complete');
  }
}
