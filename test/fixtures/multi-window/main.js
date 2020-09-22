const { app, BrowserWindow } = require('electron');

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
      enableRemoteModule: true
    }
  });
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
      enableRemoteModule: true
    }
  });
  bottomWindow.loadFile('index-bottom.html');
  bottomWindow.on('closed', function () {
    bottomWindow = null;
  });
});
