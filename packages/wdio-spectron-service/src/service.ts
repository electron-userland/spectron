import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import split2 from 'split2';
import { path as chromedriverPath } from 'chromedriver';
import logger from '@wdio/logger';
import tcpPortUsed from 'tcp-port-used';
import EventEmitter from 'events';
import { Capabilities, Options, Services, Frameworks } from '@wdio/types';
import getFilePath from './getFilePath';
import { SpectronClient } from '~/common/types';

const log = logger('spectron');

const POLL_INTERVAL = 100;
const POLL_TIMEOUT = 10000;
const DEFAULT_CONNECTION = {
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 9515,
  path: '/',
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ChromeOptions = {
  binary: string;
  args: string[];
  windowTypes: ['app', 'webview'];
};

export type Options = {
  'port'?: number;
  'path'?: string;
  'protocol'?: string;
  'hostname'?: string;
  'outputDir'?: string;
  'logFileName'?: string;
  'chromedriverCustomPath'?: string;
  'args'?: string[];
  'browserName'?: 'chrome';
  'goog:chromeOptions'?: ChromeOptions;
};

// export type Capabilities = {
//   'browserName': 'chrome';
//   'goog:chromeOptions': ChromeOptions;
// };

export type Config = {
  outputDir: string;
};

function redirectLogStream(outputDir: string, process: ChildProcessWithoutNullStreams): void {
  const logFile = getFilePath(outputDir, 'wdio-chromedriver.log');

  // ensure file & directory exists
  fs.ensureFileSync(logFile);

  const logStream = fs.createWriteStream(logFile, { flags: 'w' });

  process?.stdout.pipe(logStream);
  process?.stderr.pipe(logStream);
}

export default class SpectronWorkerService implements Services.ServiceInstance {
  constructor(
    options: Services.ServiceOption,
    caps: Capabilities.Capabilities,
    config: Omit<Options.Testrunner, 'capabilities'>,
  ) {
    this.options = {
      'protocol': options.protocol || DEFAULT_CONNECTION.protocol,
      'hostname': options.hostname || DEFAULT_CONNECTION.hostname,
      'port': options.port || DEFAULT_CONNECTION.port,
      'path': options.path || DEFAULT_CONNECTION.path,
      'browserName': 'chrome',
      'goog:chromeOptions': caps['goog:chromeOptions'],
    } as Options;

    this.outputDir = config.outputDir;
    this.chromedriverCustomPath = options.chromedriverCustomPath
      ? path.resolve(options.chromedriverCustomPath)
      : chromedriverPath;
    console.log('constructor end', this.options);
  }

  public options;

  public browser?: SpectronClient;

  public outputDir;

  public chromedriverCustomPath;

  public process: ChildProcessWithoutNullStreams | undefined;

  onWorkerStart(
    cid: string,
    capabilities: Capabilities.DesiredCapabilities,
    specs: string[],
    args: Options.Testrunner,
    execArgv: string[],
  ): void {
    console.log('zOMG onworkerStart', cid);
    if (!this.process) {
      void (async () => {
        await this.startProcess();
      })();
      const exitHandler = () => {
        void (async () => {
          await this.killProcess.call(this);
        })();
      };
      process.on('exit', exitHandler);
      process.on('SIGINT', exitHandler);
      process.on('uncaughtException', exitHandler);
    }
  }

  before(_capabilities: Capabilities.RemoteCapability, _specs: string[], browser: SpectronClient): void {
    console.log('before yo');
    this.browser = browser;
  }

  async afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult): Promise<void> {
    // if (context === 'afterEach') {
    // quit app
    console.log('zOMG afterTest', test, context, results);
    // void (async () => {
    await this.browser?.exitElectronApp();
    await delay(1000);
    await this.killProcess();
    await this.startProcess();
    // })();
    // }
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

  async killProcess(): Promise<void> {
    if (this.process) {
      console.log('killing process on port', this.process.pid);
      await process.kill(-(this.process.pid as number));
    }
  }

  async startProcess(): Promise<void> {
    console.log('zOMG startProcess');
    const port = this.options.port as number;
    const args = [`--port=${port}`, `--url-base=${this.options.path as string}`];
    let command = this.chromedriverCustomPath;
    log.info(`Start Chromedriver (${command}) with args ${args.join(' ')}`);
    if (!fs.existsSync(command)) {
      log.warn('Could not find chromedriver in default path: ', command);
      log.warn('Falling back to use global chromedriver bin');
      command = process?.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
    }
    const chromedriverProcess = spawn(command, args, { detached: true });
    console.log('spawned CD process', chromedriverProcess.pid);
    this.process = chromedriverProcess;

    if (this.outputDir && typeof this.outputDir === 'string') {
      redirectLogStream(this.outputDir, chromedriverProcess);
    } else {
      const split = split2();
      (chromedriverProcess.stdout.pipe(split) as EventEmitter).on('data', (...logArgs) => log.info(...logArgs));
      (chromedriverProcess.stderr.pipe(split) as EventEmitter).on('data', (...logArgs) => log.warn(...logArgs));
    }

    await tcpPortUsed.waitUntilUsed(port, POLL_INTERVAL, POLL_TIMEOUT);
  }
}
