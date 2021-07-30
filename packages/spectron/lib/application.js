/* global browser */
const { createApi } = require('./api');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initSpectron({ quitTimeout }) {
  const spectron = await (async () => {
    const spectronObj = {};
    const apiNames = ['browserWindow', 'webContents', 'app', 'mainProcess', 'rendererProcess'];
    const apis = await createApi(browser, apiNames);
    Object.keys(apis).forEach((apiName) => {
      spectronObj[apiName] = apis[apiName];
    });
    spectronObj.electronApp = apis.app;

    spectronObj.quit = async () => {
      // await spectronObj.electronApp.quit();
      if (spectronObj.mainProcess) {
        await spectronObj.mainProcess.abort();
      }

      await delay(quitTimeout);
    };

    async function waitUntilWindowLoaded(timeout) {
      try {
        await this.waitUntil(async () => !(await spectronObj.webContents.isLoading()), timeout);
      } catch (error) {
        error.message = `waitUntilWindowLoaded error: ${error.message}`;
        throw error;
      }
    }

    async function getSelectedText() {
      await this.execute(() => window.getSelection().toString());
    }

    async function windowByIndex(index) {
      const handles = await this.getWindowHandles();
      await this.switchToWindow(handles[index]);
    }

    async function getWindowCount() {
      const handles = await this.getWindowHandles();
      return handles.length;
    }

    async function waitUntilTextExists(selector, text, timeout) {
      try {
        await this.waitUntil(async () => {
          const elem = await this.$(selector);
          if (!(await elem.isExisting())) {
            return false;
          }
          const selectorText = await elem.getText();
          return Array.isArray(selectorText) ? selectorText.some((s) => s.includes(text)) : selectorText.includes(text);
        }, timeout);
      } catch (error) {
        error.message = `waitUntilTextExists error: ${error.message}`;
        throw error;
      }
    }

    browser.addCommand('waitUntilTextExists', waitUntilTextExists);
    browser.addCommand('waitUntilWindowLoaded', waitUntilWindowLoaded);
    browser.addCommand('getWindowCount', getWindowCount);
    browser.addCommand('windowByIndex', windowByIndex);
    browser.addCommand('getSelectedText', getSelectedText);

    spectronObj.client = browser;

    return spectronObj;
  })();

  return spectron;
}

module.exports = {
  initSpectron,
};
