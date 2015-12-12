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
  this.waitTimeout = parseInt(options.waitTimeout, 10) || 5000

  this.path = options.path
  this.args = options.args || []
  this.env = options.env || {}
}

Application.prototype.start = function () {
  var self = this
  return self.exists()
    .then(function () { return self.startChromeDriver() })
    .then(function () { return self.createClient() })
    .then(function () { self.running = true })
}

Application.prototype.stop = function () {
  var self = this

  if (!self.isRunning()) return Promise.reject(Error('Application not running'))

  return new Promise(function (resolve, reject) {
    self.client.windowByIndex(0).quitApplication().then(function () {
      setTimeout(function () {
        self.client.end().then(function () {
          self.chromeDriver.stop()
          self.running = false
          resolve()
        }, reject)
      }, self.quitTimeout)
    }, reject)
  })
}

Application.prototype.isRunning = function () {
  return this.running
}

Application.prototype.exists = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    fs.stat(self.path, function (error, stat) {
      if (error) return reject(error)
      if (stat.isFile()) return resolve()
      reject(Error('Application path specified is not a file: ' + self.path))
    })
  })
}

Application.prototype.startChromeDriver = function () {
  var self = this

  return new Promise(function (resolve, reject) {
    self.chromeDriver = new ChromeDriver(self.host, self.port)
    self.chromeDriver.start()

    var tries = 0
    var timerID = setInterval(function () {
      self.chromeDriver.isRunning(function (running) {
        if (running) {
          clearInterval(timerID)
          return resolve()
        } else if (tries >= 100) {
          clearInterval(timerID)
          throw reject(Error('Could not get a response from ChromeDriver'))
        }
        tries++
      })
    }, 100)
  })
}

Application.prototype.createClient = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    var args = []
    args.push('spectron-path=' + self.path)
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
      desiredCapabilities: {
        browserName: 'electron',
        chromeOptions: {
          binary: launcherPath,
          args: args
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
  // TODO Remove in favor of get/setBounds API
  this.client.addCommand('getWindowDimensions', function () {
    return this.getWindowBounds()
  })
  this.client.addCommand('setWindowDimensions', function (x, y, width, height) {
    return this.setWindowBounds({x: x, y: y, width: width, height: height})
  })

  this.client.addCommand('getWindowWidth', function () {
    return this.getWindowBounds().then(function (bounds) {
      return bounds.width
    })
  })

  this.client.addCommand('getWindowHeight', function () {
    return this.getWindowBounds().then(function (bounds) {
      return bounds.height
    })
  })

  this.client.addCommand('setWindowBounds', function (bounds) {
    return this.execute(function (bounds) {
      require('electron').remote.getCurrentWindow().setBounds(bounds)
    }, bounds)
  })

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

  this.client.addCommand('quitApplication', function () {
    return this.execute(function () {
      require('electron').remote.app.quit()
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

  this.client.addCommand('getMainProcessGlobal', function (globalName) {
    return this.execute(function (globalName) {
      return require('electron').remote.getGlobal(globalName)
    }, globalName).then(getResponseValue)
  })

  this.client.addCommand('getArgv', function () {
    return this.execute(function () {
      return require('electron').remote.getGlobal('process').argv
    }).then(getResponseValue)
  })

  this.client.addCommand('getClipboardText', function () {
    return this.execute(function () {
      return require('electron').clipboard.readText()
    }).then(getResponseValue)
  })

  this.client.addCommand('setClipboardText', function (text) {
    return this.execute(function (text) {
      return require('electron').clipboard.writeText(text)
    }, text).then(getResponseValue)
  })

  this.client.addCommand('setDocumentEdited', function (edited) {
    return this.execute(function (edited) {
      return require('electron').remote.getCurrentWindow().setDocumentEdited(edited)
    }, edited).then(getResponseValue)
  })

  this.client.addCommand('setRepresentedFilename', function (filename) {
    return this.execute(function (filename) {
      return require('electron').remote.getCurrentWindow().setRepresentedFilename(filename)
    }, filename).then(getResponseValue)
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

  this.client.addCommand('isWindowLoading', function () {
    return this.execute(function () {
      return require('electron').remote.getCurrentWindow().webContents.isLoading()
    }).then(getResponseValue)
  })

  this.addCurrentWindowGetter('getBounds', 'getWindowBounds')
  this.addCurrentWindowGetter('isDevToolsOpened', 'isWindowDevToolsOpened')
  this.addCurrentWindowGetter('isFocused', 'isWindowFocused')
  this.addCurrentWindowGetter('isFullScreen', 'isWindowFullScreen')
  this.addCurrentWindowGetter('isMaximized', 'isWindowMaximized')
  this.addCurrentWindowGetter('isMinimized', 'isWindowMinimized')
  this.addCurrentWindowGetter('isVisible', 'isWindowVisible')

  this.addCurrentWindowGetter('hide', 'hideWindow')
  this.addCurrentWindowGetter('maximize', 'maximizeWindow')
  this.addCurrentWindowGetter('minimize', 'minimizeWindow')
  this.addCurrentWindowGetter('show', 'showWindow')

  this.addCurrentWindowGetter('selectAll', 'selectAll')
  this.addCurrentWindowGetter('paste', 'paste')

  this.addCurrentWindowGetter('isDocumentEdited', 'isDocumentEdited')
  this.addCurrentWindowGetter('getRepresentedFilename', 'getRepresentedFilename')
}

Application.prototype.addCurrentWindowGetter = function (methodName, commandName) {
  if (!commandName) commandName = methodName

  var currentWindowGetter = function (methodName) {
    return require('electron').remote.getCurrentWindow()[methodName]()
  }

  this.client.addCommand(commandName, function () {
    return this.execute(currentWindowGetter, methodName).then(getResponseValue)
  })
}

var getResponseValue = function (response) {
  return response.value
}

module.exports = Application
