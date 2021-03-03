const { app, BrowserWindow } = require('electron');
require('@electron/remote/main').initialize();

let mainWindow = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});
