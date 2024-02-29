const { app, BrowserWindow } = require('electron');
require('@electron/remote/main').initialize();

let mainWindow = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 400,
    minHeight: 100,
    minWidth: 100,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });
  require('@electron/remote/main').enable(mainWindow.webContents);
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});
