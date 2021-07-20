/* eslint node/no-unpublished-require: off */
const { app, BrowserWindow } = require('electron');
const path = require('path');
require('../../../main');

let mainWindow = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      preload: path.resolve(__dirname, '../../../preload.js'),
      nodeIntegration: true,
      enableRemoteModule: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});
