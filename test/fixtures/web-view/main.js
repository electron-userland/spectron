var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow

var mainWindow = null

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 400,
    minHeight: 100,
    minWidth: 100
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
