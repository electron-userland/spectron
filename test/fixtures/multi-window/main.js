var app = require('app')
var BrowserWindow = require('browser-window')

var topWindow = null
var bottomWindow = null

app.on('ready', function () {
  topWindow = new BrowserWindow({
    x: 25,
    y: 35,
    width: 200,
    height: 100
  })
  topWindow.loadUrl('file://' + __dirname + '/index-top.html')
  topWindow.on('closed', function () { topWindow = null })

  bottomWindow = new BrowserWindow({
    x: 25,
    y: 135,
    width: 300,
    height: 50
  })
  bottomWindow.loadUrl('file://' + __dirname + '/index-bottom.html')
  bottomWindow.on('closed', function () { bottomWindow = null })
})
