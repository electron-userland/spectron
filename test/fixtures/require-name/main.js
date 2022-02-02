const { app, BrowserWindow } = require('electron');
require('@electron/remote/main').initialize();
const path = require('path');

let mainWindow = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
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
