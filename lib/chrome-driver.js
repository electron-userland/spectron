var ChildProcess = require('child_process')
var http = require('http')
var path = require('path')

function ChromeDriver (host, port) {
  this.host = host
  this.port = port

  this.path = require.resolve('electron-chromedriver/chromedriver')
  this.urlBase = '/wd/hub'
  this.statusUrl = 'http://' + this.host + ':' + this.port + this.urlBase + '/status'
}

ChromeDriver.prototype.start = function () {
  if (this.process) throw new Error('ChromeDriver already started')

  var args = [
    this.path,
    '--port=' + this.port,
    '--url-base=' + this.urlBase
  ]
  var options = {
    cwd: process.cwd(),
    env: process.env
  }
  this.process = ChildProcess.spawn(process.execPath, args, options)

  var self = this
  global.process.on('exit', function () { self.stop() })
}

ChromeDriver.prototype.stop = function () {
  if (this.process) this.process.kill()
  this.process = null
}

ChromeDriver.prototype.isRunning = function (callback) {
  http.get(this.statusUrl, function (response) {
    callback(response.statusCode === 200)
  }).on('error', function () {
    callback(false)
  })
}

module.exports = ChromeDriver
