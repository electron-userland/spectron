var Api = require('./api')
var ChromeDriver = require('./chrome-driver')
var DevNull = require('dev-null')
var fs = require('fs')
var path = require('path')
var WebDriver = require('webdriverio')

function Application (options) {
  options = options || {}
  this.host = options.host || '127.0.0.1'
  this.port = parseInt(options.port, 10) || 9515

  this.quitTimeout = parseInt(options.quitTimeout, 10) || 1000
  this.startTimeout = parseInt(options.startTimeout, 10) || 5000
  this.waitTimeout = parseInt(options.waitTimeout, 10) || 5000

  this.connectionRetryCount = parseInt(options.connectionRetryCount, 10) || 10
  this.connectionRetryTimeout = parseInt(options.connectionRetryTimeout, 10) || 30000

  this.nodePath = options.nodePath || process.execPath
  this.path = options.path

  this.args = options.args || []
  this.env = options.env || {}
  this.workingDirectory = options.cwd || process.cwd()
  this.debuggerAddress = options.debuggerAddress
  this.chromeDriverLogPath = options.chromeDriverLogPath

  this.api = new Api(this, {requireName: options.requireName})
  this.setupPromiseness()
}

Application.prototype.setupPromiseness = function () {
  var self = this
  self.transferPromiseness = function (target, promise) {
    self.api.transferPromiseness(target, promise)
  }
}

Application.prototype.start = function () {
  var self = this
  return self.exists()
    .then(function () { return self.startChromeDriver() })
    .then(function () { return self.createClient() })
    .then(function () { return self.api.initialize() })
    .then(function () { return self.client.timeoutsAsyncScript(self.waitTimeout) })
    .then(function () { self.running = true })
    .then(function () { return self })
}

Application.prototype.stop = function () {
  var self = this

  if (!self.isRunning()) return Promise.reject(Error('Application not running'))

  return new Promise(function (resolve, reject) {
    var endClient = function () {
      setTimeout(function () {
        self.client.end().then(function () {
          self.chromeDriver.stop()
          self.running = false
          resolve(self)
        }, reject)
      }, self.quitTimeout)
    }

    if (self.api.nodeIntegration) {
      self.client.windowByIndex(0).electron.remote.app.quit().then(endClient, reject)
    } else {
      self.client.windowByIndex(0).execute(function () {
        window.close()
      }).then(endClient, reject)
    }
  })
}

Application.prototype.restart = function () {
  var self = this
  return self.stop().then(function () {
    return self.start()
  })
}

Application.prototype.isRunning = function () {
  return this.running
}

Application.prototype.exists = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    // Binary path is ignored by ChromeDriver if debuggerAddress is set
    if (self.debuggerAddress) return resolve()

    if (typeof self.path === 'string') {
      fs.stat(self.path, function (error, stat) {
        if (error) return reject(error)
        if (stat.isFile()) return resolve()
        reject(Error('Application path specified is not a file: ' + self.path))
      })
    } else if (self.path && (typeof self.path === 'object')) {
      fs.stat(self.path.script, function (error, stat) {
        if (error) return reject(error)
        if (!stat.isFile()) reject(Error('Script path specified is not a file: ' + self.path.script))
        fs.stat(self.path.electron, function (error, stat) {
          if (error) return reject(error)
          if (stat.isFile()) return resolve()
          reject(Error('Electron path specified is not a file: ' + self.path.electron))
        })
      })
    } else {
      reject(Error('Invalid path option: ' + self.path))
    }
  })
}

Application.prototype.startChromeDriver = function () {
  this.chromeDriver = new ChromeDriver(this.host, this.port, this.nodePath, this.startTimeout, this.workingDirectory, this.chromeDriverLogPath)
  return this.chromeDriver.start()
}

Application.prototype.createClient = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    var args = []
    if (typeof self.path === 'string') {
      args.push('spectron-path=' + self.path)
    } else {
      args.push('spectron-electron-path=' + self.path.electron)
      args.push('spectron-script-path=' + self.path.script)
    }
    self.args.forEach(function (arg, index) {
      args.push('spectron-arg' + index + '=' + arg)
    })

    for (var name in self.env) {
      args.push('spectron-env-' + name + '=' + self.env[name])
    }

    var launcherPath = null
    if (process.platform === 'win32') {
      launcherPath = path.join(__dirname, '..', 'bin', 'launcher.exe')
    } else {
      launcherPath = path.join(__dirname, 'launcher.js')
    }

    if (process.env.APPVEYOR) {
      args.push('no-sandbox')
    }

    var options = {
      host: self.host,
      port: self.port,
      waitforTimeout: self.waitTimeout,
      connectionRetryCount: self.connectionRetryCount,
      connectionRetryTimeout: self.connectionRetryTimeout,
      desiredCapabilities: {
        browserName: 'electron',
        chromeOptions: {
          binary: launcherPath,
          args: args,
          debuggerAddress: self.debuggerAddress
        }
      },
      logOutput: DevNull()
    }

    self.client = WebDriver.remote(options)
    self.addCommands()
    self.initializeClient(resolve, reject)
  })
}

Application.prototype.initializeClient = function (resolve, reject) {
  var maxTries = 10
  var tries = 0
  var self = this
  var init = function () {
    tries++
    self.client.init().then(resolve, function (error) {
      if (tries >= maxTries) {
        error.message = 'Client initialization failed after ' + tries + ' attempts: '
        error.message += error.type + ' ' + error.message
        reject(error)
      } else {
        global.setTimeout(init, 250)
      }
    })
  }
  init()
}

Application.prototype.addCommands = function () {
  this.client.addCommand('waitUntilTextExists', function (selector, text, timeout) {
    return this.waitUntil(function () {
      return this.isExisting(selector).getText(selector).then(function (selectorText) {
        return selectorText.indexOf(text) !== -1
      })
    }, timeout).then(function () { }, function (error) {
      error.message = 'waitUntilTextExists ' + error.message
      return error
    })
  })

  this.client.addCommand('waitUntilWindowLoaded', function (timeout) {
    return this.waitUntil(function () {
      return this.isWindowLoading().then(function (loading) {
        return !loading
      })
    }, timeout).then(function () { }, function (error) {
      error.message = 'waitUntilWindowLoaded ' + error.message
      return error
    })
  })

  this.client.addCommand('getWindowCount', function () {
    return this.windowHandles().then(getResponseValue).then(function (handles) {
      return handles.length
    })
  })

  this.client.addCommand('windowByIndex', function (index) {
    return this.windowHandles().then(getResponseValue).then(function (handles) {
      return this.window(handles[index])
    })
  })

  this.client.addCommand('getSelectedText', function () {
    return this.execute(function () {
      return window.getSelection().toString()
    }).then(getResponseValue)
  })

  this.client.addCommand('getRenderProcessLogs', function () {
    return this.log('browser').then(getResponseValue)
  })

  var self = this
  this.client.addCommand('getMainProcessLogs', function () {
    var logs = self.chromeDriver.getLogs()
    self.chromeDriver.clearLogs()
    return logs
  })
}

var getResponseValue = function (response) {
  return response.value
}

module.exports = Application
