import Electron from 'electron';
import { WaitUntilOptions } from 'webdriverio';
import { LooseObject } from '@common/types';
import { ApiName, ApiNames, createApi } from './api';
/* global browser */

// interface LooseObject {
//   [key: string]: any;
// }

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

declare namespace WebdriverIO {
  interface BrowserObject {}
  interface Element {}
}

export interface SpectronClient extends WebdriverIO.BrowserObject {
  [key: string]: any;
  $(): Promise<WebdriverIO.Element>;

  addCommand(commandName: string, executeApiCall: Function): Promise<void>;
  /**
   * Wait until the window is no longer loading.
   * Takes an optional timeout in milliseconds that defaults to 5000.
   */
  waitUntilWindowLoaded(timeout?: number): Promise<void>;

  /**
   * Wait until the element matching the given selector contains the given text.
   * Takes an optional timeout in milliseconds that defaults to 5000.
   */
  waitUntilTextExists(selector: string, text: string, timeout?: number): Promise<void>;

  /**
   * Gets the number of open windows. <webview> tags are also counted as separate windows.
   */
  getWindowCount(): Promise<number>;
  /**
   * Focus a window using its index from the windowHandles() array.
   * <webview> tags can also be focused as a separate window.
   */
  windowByIndex(index: number): Promise<void>;
  /**
   * Get the selected text in the current window.
   */
  getSelectedText(): Promise<string>;
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
