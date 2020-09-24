const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    center: true,
    width: 600,
    height: 400,
    minHeight: 100,
    minWidth: 100,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});
