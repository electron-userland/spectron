/* eslint node/no-unpublished-require: off */
const { app, BrowserWindow } = require('electron');
const path = require('path');
require('../../../main');

let topWindow = null;
let bottomWindow = null;

app.on('ready', () => {
  topWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      preload: path.resolve(__dirname, '..', '..', '..', 'preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
    },
  });
  topWindow.on('closed', () => {
    topWindow = null;
  });

  bottomWindow = new BrowserWindow({
    x: 25,
    y: 135,
    width: 300,
    height: 50,
    webPreferences: {
      preload: path.resolve(__dirname, '..', '..', '..', 'preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
    },
  });
  bottomWindow.on('closed', () => {
    bottomWindow = null;
  });

  topWindow.loadFile('index-top.html');
  bottomWindow.loadFile('index-bottom.html');
});
