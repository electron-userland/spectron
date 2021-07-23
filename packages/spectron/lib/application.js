/* global window */
const DevNull = require('dev-null');
const fs = require('fs-extra');
const path = require('path');
const WebDriver = require('webdriverio');
const ChromeDriver = require('./chrome-driver');
const { createApi } = require('./api');

function Application(options = {}) {
  this.host = options.host || '127.0.0.1';
  this.port = parseInt(options.port, 10) || 9515;

  this.quitTimeout = parseInt(options.quitTimeout, 10) || 1000;
  this.startTimeout = parseInt(options.startTimeout, 10) || 5000;
  this.waitTimeout = parseInt(options.waitTimeout, 10) || 5000;

  this.connectionRetryCount = parseInt(options.connectionRetryCount, 10) || 10;
  this.connectionRetryTimeout = parseInt(options.connectionRetryTimeout, 10) || 30000;

  this.nodePath = options.nodePath || process.execPath;
  this.path = options.path;

  this.args = options.args || [];
  this.chromeDriverArgs = options.chromeDriverArgs || [];
  this.env = options.env || {};
  this.workingDirectory = options.cwd || process.cwd();
  this.debuggerAddress = options.debuggerAddress;
  this.chromeDriverLogPath = options.chromeDriverLogPath;
  this.webdriverLogPath = options.webdriverLogPath;
  this.webdriverOptions = options.webdriverOptions || {};
}

Application.prototype.start = function start() {
  const self = this;
  return self
    .exists()
    .then(() => self.startChromeDriver())
    .then(async () => {
      self.client = await self.createClient();
    })
    .then(async () => {
      const apis = await createApi(self.client, [
        'browserWindow',
        'webContents',
        'app',
        'mainProcess',
        'rendererProcess',
      ]);
      Object.keys(apis).forEach((apiName) => {
        self[apiName] = apis[apiName];
      });
      self.electronApp = apis.app;
    })
    .then(() => {
      self.addCommands();
    })
    .then(() => self.client.setTimeouts(self.waitTimeout, self.waitTimeout, self.waitTimeout))
    .then(() => {
      self.running = true;
    })
    .then(() => self);
};

Application.prototype.stop = async function stop() {
  if (!this.isRunning()) {
    throw new Error('Application not running');
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await delay(this.quitTimeout);
  await this.electronApp.quit();

  this.chromeDriver.stop();
  this.running = false;

  return this;
};

Application.prototype.restart = async function restart() {
  await this.stop();
  return this.start();
};

Application.prototype.isRunning = function isRunning() {
  return this.running;
};

Application.prototype.getSettings = function getSettings() {
  return {
    host: this.host,
    port: this.port,
    quitTimeout: this.quitTimeout,
    startTimeout: this.startTimeout,
    waitTimeout: this.waitTimeout,
    connectionRetryCount: this.connectionRetryCount,
    connectionRetryTimeout: this.connectionRetryTimeout,
    nodePath: this.nodePath,
    path: this.path,
    args: this.args,
    chromeDriverArgs: this.chromeDriverArgs,
    env: this.env,
    workingDirectory: this.workingDirectory,
    debuggerAddress: this.debuggerAddress,
    chromeDriverLogPath: this.chromeDriverLogPath,
    webdriverLogPath: this.webdriverLogPath,
    webdriverOptions: this.webdriverOptions,
  };
};

Application.prototype.exists = async function exists() {
  const self = this;

  // Binary path is ignored by ChromeDriver if debuggerAddress is set
  if (self.debuggerAddress) {
    return;
  }

  if (typeof self.path !== 'string') {
    throw new Error('Application path must be a string');
  }

  try {
    const stat = await fs.stat(this.path);
    if (!stat.isFile()) {
      throw new Error(`Application path specified is not a file: ${this.path}`);
    }
    return;
  } catch (error) {
    throw new Error(`Exists error: ${error.message}`);
  }
};

Application.prototype.startChromeDriver = function startChromeDriver() {
  this.chromeDriver = new ChromeDriver(
    this.host,
    this.port,
    this.nodePath,
    this.startTimeout,
    this.workingDirectory,
    this.chromeDriverLogPath,
  );
  return this.chromeDriver.start();
};

Application.prototype.createClient = async function createClient() {
  const self = this;
  const args = [`spectron-path=${self.path}`]
    .concat(self.args.map((arg, index) => `spectron-arg${index}=${arg}`))
    .concat(Object.keys(self.env).map((name) => `spectron-env-${name}=${self.env[name]}`))
    .concat(self.chromeDriverArgs);

  const isWin = process.platform === 'win32';
  const launcherPath = path.join(__dirname, isWin ? 'launcher.bat' : 'launcher.js');

  if (process.env.APPVEYOR) {
    args.push('no-sandbox');
  }

  const options = {
    hostname: self.host,
    port: self.port,
    waitforTimeout: self.waitTimeout,
    connectionRetryCount: self.connectionRetryCount,
    connectionRetryTimeout: self.connectionRetryTimeout,
    logLevel: 'error',
    capabilities: {
      'goog:chromeOptions': {
        binary: launcherPath,
        args,
        debuggerAddress: self.debuggerAddress,
        windowTypes: ['app', 'webview'],
      },
    },
    logOutput: DevNull(),
  };

  if (self.webdriverLogPath) {
    options.outputDir = self.webdriverLogPath;
    options.logLevel = 'trace';
  }

  Object.assign(options, self.webdriverOptions);

  try {
    const remote = await WebDriver.remote(options);
    return remote;
  } catch (error) {
    throw new Error(`Webdriver error: ${error.message}`);
  }
};

Application.prototype.addCommands = function addCommands() {
  const app = this;

  function waitUntilTextExists(selector, text, timeout) {
    const self = this;
    return self
      .waitUntil(async () => {
        const elem = await self.$(selector);
        const exists = await elem.isExisting();
        if (!exists) {
          return false;
        }

        const selectorText = await elem.getText();
        return Array.isArray(selectorText) ? selectorText.some((s) => s.includes(text)) : selectorText.includes(text);
      }, timeout)
      .then(
        () => {},
        (error) => {
          error.message = `waitUntilTextExists error: ${error.message}`;
          throw error;
        },
      );
  }

  function waitUntilWindowLoaded(timeout) {
    const self = this;
    return self
      .waitUntil(() => app.webContents.isLoading().then((loading) => !loading), timeout)
      .then(
        () => {},
        (error) => {
          error.message = `waitUntilWindowLoaded error: ${error.message}`;
          throw error;
        },
      );
  }

  function getWindowCount() {
    return this.getWindowHandles().then((handles) => handles.length);
  }

  function windowByIndex(index) {
    const self = this;
    return self.getWindowHandles().then((handles) => self.switchToWindow(handles[index]));
  }

  function getSelectedText() {
    return this.execute(() => window.getSelection().toString());
  }

  function getRenderProcessLogs() {
    return this.getLogs('browser');
  }

  function getMainProcessLogs() {
    const logs = app.chromeDriver.getLogs();
    app.chromeDriver.clearLogs();
    return logs;
  }

  this.client.addCommand('waitUntilTextExists', waitUntilTextExists);
  this.client.addCommand('waitUntilWindowLoaded', waitUntilWindowLoaded);
  this.client.addCommand('getWindowCount', getWindowCount);
  this.client.addCommand('windowByIndex', windowByIndex);
  this.client.addCommand('getSelectedText', getSelectedText);
  this.client.addCommand('getRenderProcessLogs', getRenderProcessLogs);
  this.client.addCommand('getMainProcessLogs', getMainProcessLogs);
};

module.exports = Application;
