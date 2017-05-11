var app = require('electron').app
var BrowserWindow = require('electron').BrowserWindow
var protocol = require('electron').protocol

var mainWindow = null

app.on('ready', function () {
  protocol.registerBufferProtocol('spectron', (request, callback) => {
    if (request.url === 'spectron://test') {
      callback({mimeType: 'text/html', data: new Buffer('<img src="spectron://img">')})
    }
  }, (error) => {
    if (error != null) {
      app.exit(1)
    }
  })

  mainWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100
  })
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () { mainWindow = null })
})
