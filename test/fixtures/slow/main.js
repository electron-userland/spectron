var { app, BrowserWindow } = require('electron')

var mainWindow = null

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: true,
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
