/* eslint no-console: off */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import '@goosewobbler/spectron/main';

const appPath = app.getAppPath();

const appRootPath = `${appPath}/dist`;
let mainWindow = null;

app.on('ready', () => {
  console.log('main log');
  console.warn('main warn');
  console.error('main error');

  global.mainProcessGlobal = 'foo';
  global.ipcEventCount = 0;

  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 300,
    webPreferences: {
      preload: `${appRootPath}/preload.js`,
      enableRemoteModule: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.loadFile(`${appRootPath}/index.html`);

  mainWindow.on('ready-to-show', () => {
    // mainWindow.webContents.openDevTools();
  });
});

app.on('will-quit', () => {
  if (fs.existsSync(process.env.SPECTRON_TEMP_DIR)) {
    fs.writeFileSync(path.join(process.env.SPECTRON_TEMP_DIR, 'quit.txt'), '');
  }
});

ipcMain.on('ipc-event', (event, count) => {
  global.ipcEventCount += count;
});
