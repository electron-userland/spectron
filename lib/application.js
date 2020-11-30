const DevNull = require('dev-null');
const fs = require('fs');
const path = require('path');
const WebDriver = require('webdriverio');
const Accessibility = require('./accessibility');
const Api = require('./api');
const ChromeDriver = require('./chrome-driver');

class Application {
  constructor(options = {}) {
    this.host = options.host || '127.0.0.1';
    this.port = parseInt(options.port, 10) || 9515;

    this.quitTimeout = parseInt(options.quitTimeout, 10) || 1000;
    this.startTimeout = parseInt(options.startTimeout, 10) || 5000;
    this.waitTimeout = parseInt(options.waitTimeout, 10) || 5000;

    this.connectionRetryCount =
      parseInt(options.connectionRetryCount, 10) || 10;
    this.connectionRetryTimeout =
      parseInt(options.connectionRetryTimeout, 10) || 30000;

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
    this.requireName = options.requireName || 'require';

    this.api = new Api(this, this.requireName);
    this.setupPromiseness();
  }

  setupPromiseness() {
    this.transferPromiseness = (target, promise) => {
      this.api.transferPromiseness(target, promise);
    };
  }

  async start() {
    await this.exists();
    await this.startChromeDriver();
    await this.createClient();
    await this.api.initialize();

    await this.client.setTimeouts(
      this.waitTimeout,
      this.waitTimeout,
      this.waitTimeout
    );
    this.running = true;
    return this;
  }

  stop() {
    const self = this;

    if (!self.isRunning()) {
      return Promise.reject(Error('Application not running'));
    }

    return new Promise((resolve, reject) => {
      const endClient = () => {
        setTimeout(() => {
          self.chromeDriver.stop();
          self.running = false;
          resolve(self);
        }, self.quitTimeout);
      };

      if (self.api.nodeIntegration) {
        self.client.electron.remote.app.quit().then(endClient, reject);
      } else {
        self.client
          .windowByIndex(0)
          .then(() => {
            self.client.closeWindow();
          })
          .then(endClient, reject);
      }
    });
  }

  async restart() {
    await this.stop();
    return this.start();
  }

  isRunning() {
    return this.running;
  }

  getSettings() {
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
      requireName: this.requireName
    };
  }

  exists() {
    const self = this;
    return new Promise((resolve, reject) => {
      // Binary path is ignored by ChromeDriver if debuggerAddress is set
      if (self.debuggerAddress) return resolve();

      if (typeof self.path !== 'string') {
        return reject(Error('Application path must be a string'));
      }

      fs.stat(self.path, (error, stat) => {
        if (error) return reject(error);
        if (stat.isFile()) return resolve();
        reject(Error(`Application path specified is not a file: ${self.path}`));
      });
    });
  }

  startChromeDriver() {
    this.chromeDriver = new ChromeDriver(
      this.host,
      this.port,
      this.nodePath,
      this.startTimeout,
      this.workingDirectory,
      this.chromeDriverLogPath
    );
    return this.chromeDriver.start();
  }

  createClient() {
    const self = this;
    return new Promise((resolve, reject) => {
      const args = [];
      args.push(`spectron-path=${self.path}`);
      self.args.forEach((arg, index) => {
        args.push(`spectron-arg${index}=${arg}`);
      });

      for (const name in self.env) {
        if (Object.prototype.hasOwnProperty.call(self.env, name)) {
          args.push(`spectron-env-${name}=${self.env[name]}`);
        }
      }

      self.chromeDriverArgs.forEach((arg) => {
        args.push(arg);
      });

      const isWin = process.platform === 'win32';
      const launcherPath = path.join(
        __dirname,
        isWin ? 'launcher.bat' : 'launcher.js'
      );

      if (process.env.APPVEYOR) {
        args.push('no-sandbox');
      }

      const options = {
        hostname: self.host,
        port: self.port,
        waitforTimeout: self.waitTimeout,
        connectionRetryCount: self.connectionRetryCount,
        connectionRetryTimeout: self.connectionRetryTimeout,
        logLevel: 'silent',
        capabilities: {
          'goog:chromeOptions': {
            binary: launcherPath,
            args,
            debuggerAddress: self.debuggerAddress,
            windowTypes: ['app', 'webview']
          }
        },
        logOutput: DevNull()
      };

      if (self.webdriverLogPath) {
        options.outputDir = self.webdriverLogPath;
        options.logLevel = 'trace';
      }

      Object.assign(options, self.webdriverOptions);

      self.client = WebDriver.remote(options).then((remote) => {
        self.client = remote;
        self.addCommands();
        resolve();
      }, reject);
    });
  }

  addCommands() {
    this.client.addCommand(
      'waitUntilTextExists',
      function (selector, text, timeout) {
        return this.waitUntil(async () => {
          const elem = await this.$(selector);
          const exists = await elem.isExisting();
          if (!exists) {
            return false;
          }

          const selectorText = await elem.getText();
          return Array.isArray(selectorText)
            ? selectorText.some((s) => s.includes(text))
            : selectorText.includes(text);
        }, timeout).then(
          () => {},
          (error) => {
            error.message = `waitUntilTextExists ${error.message}`;
            throw error;
          }
        );
      }
    );

    this.client.addCommand('waitUntilWindowLoaded', function (timeout) {
      return this.waitUntil(
        () => this.webContents.isLoading().then((loading) => !loading),
        timeout
      ).then(
        () => {},
        (error) => {
          error.message = `waitUntilWindowLoaded ${error.message}`;
          throw error;
        }
      );
    });

    this.client.addCommand('getWindowCount', async function () {
      const { length } = await this.getWindowHandles();
      return length;
    });

    this.client.addCommand('windowByIndex', async function (index) {
      const handles = await this.getWindowHandles();
      return this.switchToWindow(handles[index]);
    });

    this.client.addCommand('getSelectedText', function () {
      return this.execute(() => window.getSelection().toString());
    });

    this.client.addCommand('getRenderProcessLogs', function () {
      return this.getLogs('browser');
    });

    this.client.addCommand('getMainProcessLogs', () => {
      const logs = this.chromeDriver.getLogs();
      this.chromeDriver.clearLogs();
      return logs;
    });

    Accessibility.addCommand(this.client, this.requireName);
  }
}

module.exports = Application;
