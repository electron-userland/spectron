const { app, BrowserWindow } = require('electron')

let mainWindow = null

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 400,
    minHeight: 100,
    minWidth: 100,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.on('closed', () => { mainWindow = null })
})
