var ChildProcess = require('child_process')
var path = require('path')
var request = require('request')
var split = require('split')

function ChromeDriver (host, port) {
  this.host = host
  this.port = port

  this.path = require.resolve('electron-chromedriver/chromedriver')
  this.urlBase = '/wd/hub'
  this.statusUrl = 'http://' + this.host + ':' + this.port + this.urlBase + '/status'
  this.logLines = []
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

  var pathToExecutable = this.path
  if (process.platform === 'win32') {
    pathToExecutable = process.execPath
  }
  this.process = ChildProcess.spawn(pathToExecutable, args, options)

  var self = this
  this.exitHandler = function () { self.stop() }
  global.process.on('exit', this.exitHandler)

  this.setupLogs()
}

ChromeDriver.prototype.setupLogs = function () {
  var linesToIgnore = 2 // First two lines are ChromeDriver specific
  var lineCount = 0

  this.logLines = []

  var self = this
  this.process.stdout.pipe(split()).on('data', function (line) {
    if (lineCount < linesToIgnore) {
      lineCount++
      return
    }
    self.logLines.push(line)
  })
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

  this.clearLogs()
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

ChromeDriver.prototype.getLogs = function () {
  return this.logLines.slice()
}

ChromeDriver.prototype.clearLogs = function () {
  this.logLines = []
}

module.exports = ChromeDriver
