const { app, BrowserWindow } = require('electron');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

let topWindow = null;
let bottomWindow = null;

app.on('ready', function () {
  topWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  remoteMain.enable(topWindow.webContents);
  topWindow.loadFile('index-top.html');
  topWindow.on('closed', function () {
    topWindow = null;
  });

  bottomWindow = new BrowserWindow({
    x: 25,
    y: 135,
    width: 300,
    height: 50,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  remoteMain.enable(bottomWindow.webContents);
  bottomWindow.loadFile('index-bottom.html');
  bottomWindow.on('closed', function () {
    bottomWindow = null;
  });
});
