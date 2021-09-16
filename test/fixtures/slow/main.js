const { app, BrowserWindow } = require('electron');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

let mainWindow = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  remoteMain.enable(mainWindow.webContents);
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});
