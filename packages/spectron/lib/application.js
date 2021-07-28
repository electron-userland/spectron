/* global window, browser */
const { createApi } = require('./api');

function Application(options = {}) {
  this.host = options.host || '127.0.0.1';
  this.port = parseInt(options.port, 10) || 9515;

  this.chromeDriver = undefined;
  this.electronApp = undefined;
  this.client = undefined;
  this.mainProcess = undefined;
  this.webContents = undefined;

  this.quitTimeout = parseInt(options.quitTimeout, 10) || 1000;
  this.startTimeout = parseInt(options.startTimeout, 10) || 5000;
  this.waitTimeout = parseInt(options.waitTimeout, 10) || 5000;

  this.connectionRetryCount = parseInt(options.connectionRetryCount, 10) || 10;
  this.connectionRetryTimeout = parseInt(options.connectionRetryTimeout, 10) || 30000;

  this.nodePath = options.nodePath || process.execPath;

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
    .then(async () => {
      self.client = browser;
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

  // await this.electronApp.quit();
  if (this.mainProcess) {
    await this.mainProcess.abort();
  }

  await delay(this.quitTimeout);

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
