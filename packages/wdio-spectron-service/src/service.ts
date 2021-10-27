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

export type Capabilities = {
  'browserName': 'chrome';
  'goog:chromeOptions': ChromeOptions;
};

export type Config = {
  outputDir: string;
};

function redirectLogStream(workerIndex: number, outputDir: string, process: ChildProcessWithoutNullStreams): void {
  const logFile = getFilePath(outputDir, `wdio-chromedriver.${workerIndex}.log`);

  // ensure file & directory exists
  fs.ensureFileSync(logFile);

  const logStream = fs.createWriteStream(logFile, { flags: 'w' });

  process?.stdout.pipe(logStream);
  process?.stderr.pipe(logStream);
}

export default class SpectronWorkerService implements Services.ServiceInstance {
  constructor(options: Options, capabilities: Capabilities, config: Omit<Options.Testrunner, 'capabilities'>) {
    this.options = {
      'protocol': options.protocol || DEFAULT_CONNECTION.protocol,
      'hostname': options.hostname || DEFAULT_CONNECTION.hostname,
      'port': options.port || DEFAULT_CONNECTION.port,
      'path': options.path || DEFAULT_CONNECTION.path,
      'browserName': 'chrome',
      'goog:chromeOptions': capabilities['goog:chromeOptions'],
    } as Options;

    this.outputDir = options.outputDir || config.outputDir;
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
    capabilities: Capabilities,
    specs: string[],
    args: Options.Testrunner,
    execArgv: string[],
  ): void {
    const workerIndex = parseInt(cid.split('-')[1]);
    // args.forEach((argument: string) => {
    //   if (argument.includes('--port')) {
    //     throw new Error('Argument "--port" already exists');
    //   }
    //   if (argument.includes('--url-base')) {
    //     throw new Error('Argument "--url-base" already exists');
    //   }
    // });

    const workerPort = (this.options.port as number) + workerIndex;
    const workerArgs = [`--port=${workerPort}`, `--url-base=${this.options.path as string}`];

    console.log('zOMG onworkerStart', workerArgs, cid);
    // args.push(`--port=${this.options.port as number}`);
    // args.push(`--url-base=${this.options.path as string}`);

    if (!this.process) {
      void (async () => {
        await this.startProcess(workerIndex, workerPort, workerArgs);
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

  async before(_capabilities: Capabilities, _specs: string[], browser: SpectronClient): Promise<void> {
    console.log('before yo');
    this.browser = browser;
  }

  afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult): void {
    // if (context === 'afterEach') {
    // quit app
    console.log('zOMG afterHook', test, context, results);
    void (async () => {
      await this.browser?.exitElectronApp();
      await delay(1000);
      // this.killProcess();
      // await this.startProcess();
    })();
    // }
  }

  async killProcess(): Promise<void> {
    console.log('killing process');
    if (this.process) {
      // this.process?.forEach((process, index) => {
      console.log('killing process on port', this.options.port);
      // spawn('kill', [(this.process.pid as number)?.toString()]);
      // this.process?.kill('SIGKILL');
      process.kill(-(this.process.pid as number));
      // await killPortProcess(this.options.port as number);
      // this.process = undefined;
      // });
    }

    // this.process?.forEach((process) => process?.kill('SIGKILL'));
    // process.exit(0);
  }

  async startProcess(workerIndex: number, port: number, workerArgs: string[]): Promise<void> {
    log.error('zOMG startProcess');
    let command = this.chromedriverCustomPath;
    log.info(`Start Chromedriver (${command}) with args ${workerArgs.join(' ')}`);
    if (!fs.existsSync(command)) {
      log.warn('Could not find chromedriver in default path: ', command);
      log.warn('Falling back to use global chromedriver bin');
      command = process?.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
    }
    const chromedriverProcess = spawn(command, workerArgs, { detached: true });
    console.log('spawned', chromedriverProcess.pid);
    this.process = chromedriverProcess;

    if (this.outputDir && typeof this.outputDir === 'string') {
      redirectLogStream(workerIndex, this.outputDir, chromedriverProcess);
    } else {
      const split = split2();
      (chromedriverProcess.stdout.pipe(split) as EventEmitter).on('data', (...logArgs) => log.info(...logArgs));
      (chromedriverProcess.stderr.pipe(split) as EventEmitter).on('data', (...logArgs) => log.warn(...logArgs));
    }

    await tcpPortUsed.waitUntilUsed(port, POLL_INTERVAL, POLL_TIMEOUT);
  }
}
