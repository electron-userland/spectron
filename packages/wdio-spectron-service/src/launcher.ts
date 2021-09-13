/* eslint no-underscore-dangle: off */
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import split2 from 'split2';
import { path as chromedriverPath } from 'chromedriver';
import logger from '@wdio/logger';
import { waitUntilUsed } from 'tcp-port-used';
import EventEmitter from 'events';
import getFilePath from './getFilePath';

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

export type ChromeOptions = {
  binary: string;
  args: string[];
  windowTypes: ['app', 'webview'];
};

export type Options = {
  'port': number;
  'path': string;
  'protocol': string;
  'hostname': string;
  'outputDir': string;
  'logFileName': string;
  'chromedriverCustomPath'?: string;
  'args': string[];
  'browserName'?: 'chrome';
  'goog:chromeOptions'?: ChromeOptions;
};

export type Capabilities = [
  {
    'browserName': 'chrome';
    'goog:chromeOptions': ChromeOptions;
  },
];

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
      'goog:chromeOptions': capabilities[0]['goog:chromeOptions'],
    } as Options;

    this.outputDir = options.outputDir || config.outputDir;
    this.logFileName = options.logFileName || DEFAULT_LOG_FILENAME;
    this.args = options.args || [];
    this.chromedriverCustomPath = options.chromedriverCustomPath
      ? path.resolve(options.chromedriverCustomPath)
      : (chromedriverPath as string);
  }

  private options;

  public outputDir;

  private logFileName;

  public args;

  public chromedriverCustomPath;

  public process?: ChildProcessWithoutNullStreams;

  async onPrepare(): Promise<void> {
    const args = this.args as string[];
    args.forEach((argument: string) => {
      if (argument.includes('--port')) {
        throw new Error('Argument "--port" already exists');
      }
      if (argument.includes('--url-base')) {
        throw new Error('Argument "--url-base" already exists');
      }
    });

    args.push(`--port=${this.options.port}`);
    args.push(`--url-base=${this.options.path}`);

    let command = this.chromedriverCustomPath;
    log.info(`Start Chromedriver (${command}) with args ${args.join(' ')}`);
    if (!fs.existsSync(command)) {
      log.warn('Could not find chromedriver in default path: ', command);
      log.warn('Falling back to use global chromedriver bin');
      command = process && process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
    }
    this.process = spawn(command, args);

    if (typeof this.outputDir === 'string') {
      this._redirectLogStream();
    } else if (this.process?.stdout && this.process?.stderr) {
      const split = split2();
      (this.process.stdout.pipe(split) as EventEmitter).on('data', (...logArgs) => log.info(...logArgs));
      (this.process.stderr.pipe(split) as EventEmitter).on('data', (...logArgs) => log.warn(...logArgs));
    }

    await waitUntilUsed(this.options.port, POLL_INTERVAL, POLL_TIMEOUT);
    process.on('exit', this.onComplete.bind(this));
    process.on('SIGINT', this.onComplete.bind(this));
    process.on('uncaughtException', this.onComplete.bind(this));
  }

  onComplete(): void {
    if (this.process) {
      this.process.kill();
    }
  }

  _redirectLogStream(): void {
    const logFile = getFilePath(this.outputDir, this.logFileName);

    // ensure file & directory exists
    fs.ensureFileSync(logFile);

    const logStream = fs.createWriteStream(logFile, { flags: 'w' });

    if (this.process) {
      this.process.stdout.pipe(logStream);
      this.process.stderr.pipe(logStream);
    }
  }
}
