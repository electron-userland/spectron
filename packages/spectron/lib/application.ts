import { Browser, WaitUntilOptions } from 'webdriverio';
import { SpectronClient } from '~/common/types';
import { ApiNames, createApi } from './api';
/* global browser */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SpectronWindow {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export interface SpectronWebContents {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export interface SpectronElectronApp {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export interface SpectronMainProcess {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export interface SpectronRendererProcess {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
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
  const spectron = await (async (): Promise<SpectronApp> => {
    const spectronObj = {} as SpectronApp;
    const apiNames: ApiNames = ['browserWindow', 'webContents', 'app', 'mainProcess', 'rendererProcess'];
    const apis = await createApi(browser as unknown as SpectronClient, apiNames);

    spectronObj.browserWindow = apis.browserWindow as SpectronWindow;
    spectronObj.webContents = apis.webContents as SpectronWebContents;
    spectronObj.mainProcess = apis.mainProcess as SpectronMainProcess;
    spectronObj.rendererProcess = apis.rendererProcess as SpectronRendererProcess;
    spectronObj.electronApp = apis.app as SpectronElectronApp;
    spectronObj.quit = async () => {
      // await spectronObj.electronApp.quit();
      if (spectronObj.mainProcess) {
        await spectronObj.mainProcess.abort();
      }

      await delay(quitTimeout);
    };

    async function waitUntilWindowLoaded(this: Browser<'async'>, timeout: Partial<WaitUntilOptions>) {
      try {
        await this.waitUntil(async () => !(await spectronObj.webContents.isLoading()), timeout);
      } catch (error) {
        throw new Error(`waitUntilWindowLoaded error: ${(error as Error).message}`);
      }
    }

    async function getSelectedText(this: Browser<'async'>) {
      await this.execute(() => (window.getSelection() as Selection).toString());
    }

    async function windowByIndex(this: Browser<'async'>, index: number) {
      const handles = await this.getWindowHandles();
      await this.switchToWindow(handles[index]);
    }

    async function getWindowCount(this: Browser<'async'>) {
      const handles = await this.getWindowHandles();
      return handles.length;
    }

    async function waitUntilTextExists(
      this: Browser<'async'>,
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
          return Array.isArray(selectorText)
            ? selectorText.some((s: string[]) => s.includes(text))
            : selectorText.includes(text);
        }, timeout);
      } catch (error) {
        throw new Error(`waitUntilTextExists error: ${(error as Error).message}`);
      }
    }

    browser.addCommand('waitUntilTextExists', waitUntilTextExists);
    browser.addCommand('waitUntilWindowLoaded', waitUntilWindowLoaded);
    browser.addCommand('getWindowCount', getWindowCount);
    browser.addCommand('windowByIndex', windowByIndex);
    browser.addCommand('getSelectedText', getSelectedText);

    spectronObj.client = browser as SpectronClient;

    return spectronObj;
  })();

  return spectron;
}
