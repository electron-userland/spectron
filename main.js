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
  if (funcName === 'capturePage') {
    const image = await browserWindow.capturePage(...args);
    if (image != null) {
      return image.toPNG().toString('base64');
    }
    return null;
  }
  if (typeof browserWindow[funcName] === 'function') {
    return browserWindow[funcName](...args);
  }
  return browserWindow[funcName];
});

ipcMain.handle('spectron.webContents.getApiKeys', (event) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  return Object.keys(webContents).filter((propName) => propName[0] !== '_');
});

ipcMain.handle('spectron.webContents.invoke', (event, funcName, ...args) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  if (typeof webContents[funcName] === 'function') {
    return webContents[funcName](...args);
  }
  return webContents[funcName];
});

ipcMain.handle('spectron.app.getApiKeys', () => Object.keys(app).filter((propName) => propName[0] !== '_'));

ipcMain.handle('spectron.app.invoke', (event, funcName, ...args) => {
  if (typeof app[funcName] === 'function') {
    return app[funcName](...args);
  }
  return app[funcName];
});

ipcMain.handle('spectron.process.getApiKeys', () => Object.keys(process).filter((propName) => propName[0] !== '_'));

ipcMain.handle('spectron.process.invoke', (event, funcName, ...args) => {
  if (typeof process[funcName] === 'function') {
    return process[funcName](...args);
  }
  return process[funcName];
});
