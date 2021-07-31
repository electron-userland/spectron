/* eslint-disable no-restricted-syntax,guard-for-in */
import { App, app, BrowserWindow, ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';

type BrowserWindowFunction = (this: BrowserWindow, ...args: unknown[]) => unknown;
type WebContentsFunction = (this: WebContents, ...args: unknown[]) => unknown;
type AppFunction = (this: App, ...args: unknown[]) => unknown;
type MainProcessFunction = (this: NodeJS.Process, ...args: unknown[]) => unknown;

ipcMain.handle('spectron.browserWindow.getApiKeys', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const keys = [];

  for (const key in window) {
    keys.push(key);
  }

  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.browserWindow.invoke', (event: IpcMainInvokeEvent, funcName: string, ...args) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender) as BrowserWindow;
  const browserWindowProp = browserWindow[funcName as keyof BrowserWindow];
  if (typeof browserWindowProp === 'function') {
    return (browserWindowProp as BrowserWindowFunction).apply(browserWindow, args);
  }
  return browserWindowProp;
});

ipcMain.handle('spectron.webContents.getApiKeys', (event) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender) as BrowserWindow;
  const keys = [];

  for (const key in webContents) {
    keys.push(key);
  }

  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.webContents.invoke', (event, funcName: string, ...args) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender) as BrowserWindow;
  const webContentsProp = webContents[funcName as keyof WebContents];
  if (typeof webContentsProp === 'function') {
    return (webContentsProp as WebContentsFunction).apply(webContents, args);
  }
  return webContentsProp;
});

ipcMain.handle('spectron.app.getApiKeys', () => {
  const keys = [];

  for (const key in app) {
    keys.push(key);
  }

  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.app.invoke', (event, funcName: string, ...args) => {
  const appProp = app[funcName as keyof App];
  if (typeof appProp === 'function') {
    return (appProp as AppFunction).apply(app, args);
  }
  return appProp;
});

ipcMain.handle('spectron.mainProcess.getApiKeys', () => {
  const keys = [];

  for (const key in process) {
    keys.push(key);
  }

  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.mainProcess.invoke', (event, funcName: string, ...args) => {
  const processProp = process[funcName as keyof NodeJS.Process];
  if (typeof processProp === 'function') {
    return (processProp as MainProcessFunction).apply(process, args);
  }
  return processProp;
});
