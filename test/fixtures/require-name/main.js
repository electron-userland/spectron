var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow
var path = require('path')

var mainWindow = null

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
