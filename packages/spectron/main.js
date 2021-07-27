const { app, BrowserWindow, ipcMain } = require('electron');

ipcMain.handle('spectron.browserWindow.getApiKeys', async (event) => {
  const window = await BrowserWindow.fromWebContents(event.sender);
  const keys = [];

  /* eslint-disable no-restricted-syntax,guard-for-in */
  for (const key in window) {
    keys.push(key);
  }
  /* eslint-enable no-restricted-syntax,guard-for-in */
  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.browserWindow.invoke', async (event, funcName, ...args) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (typeof browserWindow[funcName] === 'function') {
    return browserWindow[funcName](...args);
  }
  return browserWindow[funcName];
});

ipcMain.handle('spectron.webContents.getApiKeys', async (event) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  const keys = [];
  /* eslint-disable no-restricted-syntax,guard-for-in */
  for (const key in webContents) {
    keys.push(key);
  }
  /* eslint-enable no-restricted-syntax,guard-for-in */
  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.webContents.invoke', async (event, funcName, ...args) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  if (typeof webContents[funcName] === 'function') {
    return webContents[funcName](...args);
  }
  return webContents[funcName];
});

ipcMain.handle('spectron.app.getApiKeys', async () => {
  const keys = [];
  /* eslint-disable no-restricted-syntax,guard-for-in */
  for (const key in app) {
    keys.push(key);
  }
  /* eslint-enable no-restricted-syntax,guard-for-in */
  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.app.invoke', async (event, funcName, ...args) => {
  if (typeof app[funcName] === 'function') {
    return app[funcName](...args);
  }
  return app[funcName];
});

ipcMain.handle('spectron.mainProcess.getApiKeys', async () => {
  const keys = [];
  /* eslint-disable no-restricted-syntax,guard-for-in */
  for (const key in process) {
    keys.push(key);
  }
  /* eslint-enable no-restricted-syntax,guard-for-in */
  return keys.filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.mainProcess.invoke', async (event, funcName, ...args) => {
  if (typeof process[funcName] === 'function') {
    return process[funcName](...args);
  }
  return process[funcName];
});
