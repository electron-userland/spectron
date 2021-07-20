/* eslint node/no-unpublished-require: off */
const { app, BrowserWindow } = require('electron');
const path = require('path');
require('../../../main');

let mainWindow = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, '../../../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webviewTag: true,
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
