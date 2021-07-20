const DevNull = require('dev-null');
const fs = require('fs');
const path = require('path');
const WebDriver = require('webdriverio');
const ChromeDriver = require('./chrome-driver');
const { createApi, transferPromiseness } = require('./api');

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
  this.transferPromiseness = (target, promise) => transferPromiseness(target, promise);
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
      const { browserWindow, webContents, app } = await createApi(self.client);
      self.browserWindow = browserWindow;
      self.webContents = webContents;
      self.electronApp = app;
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
    return Promise.reject(Error('Application not running'));
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await delay(this.quitTimeout);
  await this.electronApp.quit();

  this.chromeDriver.stop();
  this.running = false;

  return Promise.resolve(this);
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

Application.prototype.exists = function exists() {
  const self = this;
  return new Promise(function (resolve, reject) {
    // Binary path is ignored by ChromeDriver if debuggerAddress is set
    if (self.debuggerAddress) return resolve();

    if (typeof self.path !== 'string') {
      return reject(Error('Application path must be a string'));
    }

    fs.stat(self.path, function (error, stat) {
      if (error) return reject(error);
      if (stat.isFile()) return resolve();
      reject(Error('Application path specified is not a file: ' + self.path));
    });
  });
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

Application.prototype.createClient = function createClient() {
  const self = this;
  return new Promise(function (resolve, reject) {
    const args = [];
    args.push('spectron-path=' + self.path);
    self.args.forEach(function (arg, index) {
      args.push('spectron-arg' + index + '=' + arg);
    });

    for (const name in self.env) {
      if (Object.prototype.hasOwnProperty.call(self.env, name)) {
        args.push('spectron-env-' + name + '=' + self.env[name]);
      }
    }

    self.chromeDriverArgs.forEach(function (arg) {
      args.push(arg);
    });

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
          args: args,
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

    WebDriver.remote(options).then(function (remote) {
      resolve(remote);
    }, reject);
  });
};

Application.prototype.addCommands = function addCommands() {
  const app = this;
  this.client.addCommand('waitUntilTextExists', function (selector, text, timeout) {
    const self = this;
    return self
      .waitUntil(async function () {
        const elem = await self.$(selector);
        const exists = await elem.isExisting();
        if (!exists) {
          return false;
        }

        const selectorText = await elem.getText();
        return Array.isArray(selectorText) ? selectorText.some((s) => s.includes(text)) : selectorText.includes(text);
      }, timeout)
      .then(
        function () {},
        function (error) {
          error.message = 'waitUntilTextExists ' + error.message;
          throw error;
        },
      );
  });

  this.client.addCommand('waitUntilWindowLoaded', function (timeout) {
    const self = this;
    return self
      .waitUntil(function () {
        return app.webContents.isLoading().then(function (loading) {
          return !loading;
        });
      }, timeout)
      .then(
        function () {},
        function (error) {
          error.message = 'waitUntilWindowLoaded ' + error.message;
          throw error;
        },
      );
  });

  this.client.addCommand('getWindowCount', function () {
    return this.getWindowHandles().then(function (handles) {
      return handles.length;
    });
  });

  this.client.addCommand('windowByIndex', function (index) {
    const self = this;
    return self.getWindowHandles().then(function (handles) {
      return self.switchToWindow(handles[index]);
    });
  });

  this.client.addCommand('getSelectedText', function () {
    return this.execute(function () {
      return window.getSelection().toString();
    });
  });

  this.client.addCommand('getRenderProcessLogs', function () {
    return this.getLogs('browser');
  });

  const self = this;
  this.client.addCommand('getMainProcessLogs', function () {
    const logs = self.chromeDriver.getLogs();
    self.chromeDriver.clearLogs();
    return logs;
  });
};

module.exports = Application;
