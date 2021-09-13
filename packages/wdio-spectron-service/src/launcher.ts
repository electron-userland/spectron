import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import split2 from 'split2';
import { path as chromedriverPath } from 'chromedriver';
import logger from '@wdio/logger';
import tcpPortUsed from 'tcp-port-used';
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

const isMultiremote = (obj) => typeof obj === 'object' && !Array.isArray(obj);
const isChrome = (cap) => cap.browserName && cap.browserName.toLowerCase() === 'chrome';

export default class ChromeDriverLauncher {
  constructor(options, capabilities, config) {
    this.options = {
      protocol: options.protocol || DEFAULT_CONNECTION.protocol,
      hostname: options.hostname || DEFAULT_CONNECTION.hostname,
      port: options.port || DEFAULT_CONNECTION.port,
      path: options.path || DEFAULT_CONNECTION.path,
    };

    this.outputDir = options.outputDir || config.outputDir;
    this.logFileName = options.logFileName || DEFAULT_LOG_FILENAME;
    this.capabilities = capabilities;
    this.args = options.args || [];
    this.chromedriverCustomPath = options.chromedriverCustomPath
      ? path.resolve(options.chromedriverCustomPath)
      : chromedriverPath;
  }

  async onPrepare() {
    this.args.forEach((argument) => {
      if (argument.includes('--port')) {
        throw new Error('Argument "--port" already exists');
      }
      if (argument.includes('--url-base')) {
        throw new Error('Argument "--url-base" already exists');
      }
    });

    this.args.push(`--port=${this.options.port}`);
    this.args.push(`--url-base=${this.options.path}`);

    /**
     * update capability connection options to connect
     * to chromedriver
     */
    this._mapCapabilities();

    let command = this.chromedriverCustomPath;
    log.info(`Start Chromedriver (${command}) with args ${this.args.join(' ')}`);
    if (!fs.existsSync(command)) {
      log.warn('Could not find chromedriver in default path: ', command);
      log.warn('Falling back to use global chromedriver bin');
      command = process && process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
    }
    this.process = spawn(command, this.args);

    if (typeof this.outputDir === 'string') {
      this._redirectLogStream();
    } else {
      this.process.stdout.pipe(split2()).on('data', log.info);
      this.process.stderr.pipe(split2()).on('data', log.warn);
    }

    await tcpPortUsed.waitUntilUsed(this.options.port, POLL_INTERVAL, POLL_TIMEOUT);
    process.on('exit', this.onComplete.bind(this));
    process.on('SIGINT', this.onComplete.bind(this));
    process.on('uncaughtException', this.onComplete.bind(this));
  }

  onComplete() {
    if (this.process) {
      this.process.kill();
    }
  }

  _redirectLogStream() {
    const logFile = getFilePath(this.outputDir, this.logFileName);

    // ensure file & directory exists
    fs.ensureFileSync(logFile);

    const logStream = fs.createWriteStream(logFile, { flags: 'w' });
    this.process.stdout.pipe(logStream);
    this.process.stderr.pipe(logStream);
  }

  _mapCapabilities() {
    if (isMultiremote(this.capabilities)) {
      for (const cap in this.capabilities) {
        if (isChrome(this.capabilities[cap].capabilities)) {
          Object.assign(this.capabilities[cap], this.options);
        }
      }
    } else {
      for (const cap of this.capabilities) {
        if (isChrome(cap)) {
          Object.assign(cap, this.options);
        }
      }
    }
  }
}
