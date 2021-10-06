import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import split2 from 'split2';
import { path as chromedriverPath } from 'chromedriver';
import logger from '@wdio/logger';
import tcpPortUsed from 'tcp-port-used';
import EventEmitter from 'events';
import getFilePath from './getFilePath';
import { SpectronClient } from '~/common/types';

const log = logger('chromedriver');

const DEFAULT_LOG_FILENAME = 'wdio-chromedriver.log';
const POLL_INTERVAL = 100;
const POLL_TIMEOUT = 10000;
const DEFAULT_CONNECTION = {
  protocol: 'http',
  hostname: 'localhost',
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

export default class ChromeDriverLauncher {
  constructor(options: Options, capabilities: Capabilities, config: Config) {
    this.options = {
      'protocol': options.protocol || DEFAULT_CONNECTION.protocol,
      'hostname': options.hostname || DEFAULT_CONNECTION.hostname,
      'port': options.port || DEFAULT_CONNECTION.port,
      'path': options.path || DEFAULT_CONNECTION.path,
      'browserName': 'chrome',
      'goog:chromeOptions': capabilities['goog:chromeOptions'],
    } as Options;

    this.outputDir = options.outputDir || config.outputDir;
    this.logFileName = options.logFileName || DEFAULT_LOG_FILENAME;
    this.args = options.args || [];
    this.chromedriverCustomPath = options.chromedriverCustomPath
      ? path.resolve(options.chromedriverCustomPath)
      : chromedriverPath;
  }

  private options;

  private logFileName;

  public browser?: SpectronClient;

  public args;

  public outputDir;

  public chromedriverCustomPath;

  public process?: ChildProcessWithoutNullStreams;

  async before(_capabilities: Capabilities, _specs: string[], browser: SpectronClient): Promise<void> {
    const { args } = this;
    // args.forEach((argument: string) => {
    //   if (argument.includes('--port')) {
    //     throw new Error('Argument "--port" already exists');
    //   }
    //   if (argument.includes('--url-base')) {
    //     throw new Error('Argument "--url-base" already exists');
    //   }
    // });
    this.browser = browser;
    log.error('zOMG onWorkerStart');

    args.push(`--port=${this.options.port as number}`);
    args.push(`--url-base=${this.options.path as string}`);

    await this.startProcess();

    process.on('exit', this.killProcess.bind(this));
    process.on('SIGINT', this.killProcess.bind(this));
    process.on('uncaughtException', this.killProcess.bind(this));
  }

  async afterHook(_test: string, context: string): Promise<void> {
    // if (context === 'afterEach') {
    // quit app
    log.error('zOMG after', context);
    await this.browser?.exitElectronApp();
    await delay(1000);
    this.killProcess();
    await this.startProcess();
    // }
  }

  killProcess(): void {
    this.process?.kill();
  }

  async startProcess(): Promise<void> {
    log.error('zOMG startProcess');
    const { args } = this;
    let command = this.chromedriverCustomPath;
    log.info(`Start Chromedriver (${command}) with args ${args.join(' ')}`);
    if (!fs.existsSync(command)) {
      log.warn('Could not find chromedriver in default path: ', command);
      log.warn('Falling back to use global chromedriver bin');
      command = process?.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
    }
    this.process = spawn(command, args);

    if (this.outputDir && typeof this.outputDir === 'string') {
      this.redirectLogStream();
    } else {
      const split = split2();
      (this.process.stdout.pipe(split) as EventEmitter).on('data', (...logArgs) => log.info(...logArgs));
      (this.process.stderr.pipe(split) as EventEmitter).on('data', (...logArgs) => log.warn(...logArgs));
    }

    await tcpPortUsed.waitUntilUsed(this.options.port as number, POLL_INTERVAL, POLL_TIMEOUT);
  }

  redirectLogStream(): void {
    const logFile = getFilePath(this.outputDir, this.logFileName);

    // ensure file & directory exists
    fs.ensureFileSync(logFile);

    const logStream = fs.createWriteStream(logFile, { flags: 'w' });

    this.process?.stdout.pipe(logStream);
    this.process?.stderr.pipe(logStream);
  }
}
