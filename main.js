const { BrowserWindow, ipcMain } = require('electron');

ipcMain.handle('spectron.getCurrentWindowFunctionNames', async (event) => {
  const window = await BrowserWindow.fromWebContents(event.sender);
  // const windowProto = Object.getPrototypeOf(window);
  // window.focus();
  // return [`wut: ${window.show}`];
  // const window = BrowserWindow.fromWebContents(event.sender);
  // const propNames = [];
  // for (const propName in window) {
  //   if (window.hasOwnProperty(propName)) {
  //     propNames.push(propName)
  //   }
  // }
  return Object.keys(browserWindowInstanceMethods); // .filter((propName) => typeof window[propName] === 'function' && propName[0] !== '_');
});

ipcMain.handle('spectron.invokeCurrentWindow', async (event, funcName, ...args) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (funcName === 'capturePage') {
    const image = await window.capturePage.apply(window, args);
    if (image != null) {
      return image.toPNG().toString('base64');
    }
    return null;
  }
  return window[funcName].apply(window, args);
});

ipcMain.handle('spectron.getCurrentWebContentsFunctionNames', (event) => {
  const webContents = BrowserWindow.fromWebContents(event.sender).webContents;
  return Object.keys(webContents).filter(
    (propName) => typeof webContents[propName] === 'function' && propName[0] !== '_',
  );
});

ipcMain.handle('spectron.invokeCurrentWebContents', (event, funcName, ...args) => {
  const webContents = BrowserWindow.fromWebContents(event.sender).webContents;
  return webContents[funcName].apply(webContents, args);
});
