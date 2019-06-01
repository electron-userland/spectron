var { app, BrowserWindow } = require('electron')

var mainWindow = null

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
