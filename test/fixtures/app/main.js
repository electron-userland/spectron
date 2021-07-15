const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('../../../main');

let mainWindow = null;

// app.allowRendererProcessReuse = true;

app.on('ready', function () {
  console.log('main log');
  console.warn('main warn');
  console.error('main error');

  global.mainProcessGlobal = 'foo';
  global.ipcEventCount = 0;

  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      devTools: false,
      preload: path.resolve(__dirname, '../../../preload.js'),
      enableRemoteModule: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});

app.on('will-quit', function () {
  if (fs.existsSync(process.env.SPECTRON_TEMP_DIR)) {
    fs.writeFileSync(path.join(process.env.SPECTRON_TEMP_DIR, 'quit.txt'), '');
  }
});

ipcMain.on('ipc-event', function (event, count) {
  global.ipcEventCount += count;
});
