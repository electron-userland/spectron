const { app, process, BrowserWindow, ipcMain } = require('electron');

// Don't know why this only returns setBounds. Object.getPrototypeOf(window) returns a few more methods but not anywhere near the full amount
ipcMain.handle('spectron.browserWindow.getFunctionNames', async (event) => {
  const window = await BrowserWindow.fromWebContents(event.sender);
  // const windowProto = Object.getPrototypeOf(window);
  return Object.keys(window).filter((propName) => typeof window[propName] === 'function' && propName[0] !== '_');
});

ipcMain.handle('spectron.browserWindow.invoke', async (event, funcName, ...args) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (funcName === 'capturePage') {
    const image = await window.capturePage(...args);
    if (image != null) {
      return image.toPNG().toString('base64');
    }
    return null;
  }
  return window[funcName](...args);
});

ipcMain.handle('spectron.webContents.getFunctionNames', (event) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  return Object.keys(webContents).filter(
    (propName) => typeof webContents[propName] === 'function' && propName[0] !== '_',
  );
});

ipcMain.handle('spectron.webContents.invoke', (event, funcName, ...args) => {
  const { webContents } = BrowserWindow.fromWebContents(event.sender);
  return webContents[funcName](...args);
});

ipcMain.handle('spectron.app.getFunctionNames', () =>
  Object.keys(app).filter((propName) => typeof app[propName] === 'function' && propName[0] !== '_'),
);

ipcMain.handle('spectron.app.invoke', (event, funcName, ...args) => app[funcName](...args));

ipcMain.handle('spectron.process.getProperties', () => {
  const properties = {};
  Object.keys(process)
    .filter((propName) => typeof process[propName] !== 'function' && propName[0] !== '_')
    .forEach((propName) => {
      properties[propName] = process[propName];
    });
  return properties;
});

ipcMain.handle('spectron.process.getFunctionNames', () =>
  Object.keys(process).filter((propName) => typeof process[propName] === 'function' && propName[0] !== '_'),
);

ipcMain.handle('spectron.process.invoke', (event, funcName, ...args) => app[funcName](...args));
