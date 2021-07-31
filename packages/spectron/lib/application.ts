import Electron from 'electron';
import { WaitUntilOptions } from 'webdriverio';
import { LooseObject, SpectronClient } from '@common/types';
import { ApiName, ApiNames, createApi } from './api';
/* global browser */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SpectronWindow extends Electron.BrowserWindow {
  [key: string]: any;
}

export interface SpectronWebContents extends Electron.WebContents {
  [key: string]: any;
}

export interface SpectronElectronApp extends Electron.App {
  [key: string]: any;
}

export interface SpectronMainProcess extends NodeJS.Process {
  [key: string]: any;
}

export interface SpectronRendererProcess extends NodeJS.Process {
  [key: string]: any;
}

export interface SpectronApp {
  client: SpectronClient;

  browserWindow: SpectronWindow;

  webContents: SpectronWebContents;

  app: SpectronElectronApp;

  electronApp: SpectronElectronApp;

  mainProcess: SpectronMainProcess;

  rendererProcess: SpectronRendererProcess;

  quit(): Promise<void>;
}

export type BasicAppSettings = {
  quitTimeout: number;
};

export async function initSpectron({ quitTimeout }: BasicAppSettings): Promise<SpectronApp> {
  const spectron = await (async () => {
    const spectronObj: LooseObject = {};
    const apiNames: ApiNames = ['browserWindow', 'webContents', 'app', 'mainProcess', 'rendererProcess'];
    const apis = await createApi(browser as unknown as SpectronClient, apiNames);
    (Object.keys(apis) as ApiNames).forEach((apiName: ApiName) => {
      spectronObj[apiName] = apis[apiName];
    });
    spectronObj.electronApp = apis.app as unknown as SpectronElectronApp;
    spectronObj.quit = async () => {
      // await spectronObj.electronApp.quit();
      if (spectronObj.mainProcess) {
        await spectronObj.mainProcess.abort();
      }

      await delay(quitTimeout);
    };

    async function waitUntilWindowLoaded(this: SpectronClient, timeout: Partial<WaitUntilOptions>) {
      try {
        await this.waitUntil(async () => !(await spectronObj.webContents.isLoading()), timeout);
      } catch (error) {
        error.message = `waitUntilWindowLoaded error: ${error.message}`;
        throw error;
      }
    }

    async function getSelectedText(this: SpectronClient) {
      await this.execute(() => (window.getSelection() as Selection).toString());
    }

    async function windowByIndex(this: SpectronClient, index: number) {
      const handles = await this.getWindowHandles();
      await this.switchToWindow(handles[index]);
    }

    async function getWindowCount(this: SpectronClient) {
      const handles = await this.getWindowHandles();
      return handles.length;
    }

    async function waitUntilTextExists(
      this: SpectronClient,
      selector: string,
      text: string,
      timeout: Partial<WaitUntilOptions>,
    ) {
      try {
        await this.waitUntil(async () => {
          const elem = await browser.$(selector);
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

  return spectron as SpectronApp;
}
