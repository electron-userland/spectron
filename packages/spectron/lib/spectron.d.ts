// Type definitions for spectron v17.0.0
// Project: https://github.com/goosewobbler/spectron
// Definitions by: goosewobbler <https://github.com/goosewobbler>

/// <reference types="node" />

declare namespace WebdriverIO {
  interface BrowserObject {}
  interface Element {}
}
declare namespace NodeJS {
  interface Process extends NodeJS.EventEmitter {}
}

declare module '@goosewobbler/spectron' {
  import * as Electron from 'electron';

  export interface SpectronClient extends WebdriverIO.BrowserObject {
    [key: string]: any;
    $(): Promise<WebdriverIO.Element>;

    addCommand(): Promise<void>;
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

  export interface SpectronWindow extends Electron.BrowserWindow {}

  export interface SpectronWebContents extends Electron.WebContents {}

  export interface SpectronElectronApp extends Electron.App {}

  export interface SpectronMainProcess extends NodeJS.Process {}

  export interface SpectronRendererProcess extends NodeJS.Process {}

  type BasicAppSettings = {
    quitTimeout?: number;
  };

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

  export function initSpectron(appSettings: BasicAppSettings): Promise<SpectronApp>;
  export function run(): Promise<void>;
}
