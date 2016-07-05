var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow

var mainWindow = null

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    center: true,
    width: 800,
    height: 600
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
