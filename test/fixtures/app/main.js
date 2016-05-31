var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow
var fs = require('fs')
var ipcMain = require('electron').ipcMain
var path = require('path')

var mainWindow = null

app.on('ready', function () {
  console.log('main log')
  console.warn('main warn')
  console.error('main error')

  global.mainProcessGlobal = 'foo'
  global.ipcEventCount = 0

  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})

app.on('will-quit', function () {
  if (fs.existsSync(process.env.SPECTRON_TEMP_DIR)) {
    fs.writeFileSync(path.join(process.env.SPECTRON_TEMP_DIR, 'quit.txt'), '')
  }
})

ipcMain.on('ipc-event', function (event, count) {
  global.ipcEventCount += count
})
