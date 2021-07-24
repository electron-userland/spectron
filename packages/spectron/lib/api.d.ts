import * as WebdriverIO from 'webdriverio';

export interface SpectronClient extends WebdriverIO.BrowserObject {
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
  /**
   * Gets the console log output from the render process.
   * The logs are cleared after they are returned.
   */
  getRenderProcessLogs(): Promise<object[]>;
  /**
   * Gets the console log output from the main process.
   * The logs are cleared after they are returned.
   */
  getMainProcessLogs(): Promise<string[]>;
}

export type ApiNames = string[];

export type WebDriverClient = SpectronClient;

export type ApiPlaceholdersObj =
  | {
      [Key: string]: {
        [Key: string]: string;
      };
    }
  | {};

export function createApi(webDriverClient: WebDriverClient, apiNames: ApiNames): Promise<ApiPlaceholdersObj>;

declare global {
  interface Window {
    spectron: {
      [Key: string]: {
        getApiKeys: () => Promise<string[]>;
        invoke: (funcName: string, ...args: any) => Promise<unknown>;
      };
    };
  }
}

declare module '@goosewobbler/spectron/api' {}
