var ChildProcess = require('child_process')
var path = require('path')
var request = require('request')

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
    '--port=' + this.port,
    '--url-base=' + this.urlBase
  ]

  var options = {
    cwd: process.cwd(),
    env: this.getEnvironment()
  }
  this.process = ChildProcess.spawn(this.path, args, options)

  var self = this
  this.exitHandler = function () { self.stop() }
  global.process.on('exit', this.exitHandler)
}

ChromeDriver.prototype.getEnvironment = function () {
  var env = {}
  Object.keys(process.env).forEach(function (key) {
    env[key] = process.env[key]
  })

  if (process.platform === 'win32') {
    env.SPECTRON_NODE_PATH = process.execPath
    env.SPECTRON_LAUNCHER_PATH = path.join(__dirname, 'launcher.js')
  }

  return env
}

ChromeDriver.prototype.stop = function () {
  if (this.exitHandler) global.process.removeListener('exit', this.exitHandler)
  this.exitHandler = null

  if (this.process) this.process.kill()
  this.process = null
}

ChromeDriver.prototype.isRunning = function (callback) {
  var requestOptions = {
    uri: this.statusUrl,
    json: true,
    followAllRedirects: true
  }
  request(requestOptions, function (error, response, body) {
    if (error) return callback(false)
    if (response.statusCode !== 200) return callback(false)
    callback(body && body.status === 0)
  })
}

module.exports = ChromeDriver
