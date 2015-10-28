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
    self.client.quitApplication().then(function () {
      setTimeout(function () {
        self.client.end().then(function () {
          self.chromeDriver.stop()
          self.running = false
          resolve()
        })
      }, self.quitTimeout)
    })
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

    var waitUntilRunning = function () {
      self.chromeDriver.isRunning(function (running) {
        if (running) return resolve()
        setTimeout(waitUntilRunning, 100)
      })
    }
    waitUntilRunning()
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
        process.nextTick(init)
      }
    })
  }
  init()
}

Application.prototype.addCommands = function () {
  this.client.addCommand('getWindowDimensions', function () {
    function getWindowDimensions () {
      var size = require('remote').getCurrentWindow().getSize()
      var position = require('remote').getCurrentWindow().getPosition()
      return {
        x: position[0],
        y: position[1],
        width: size[0],
        height: size[1]
      }
    }

    return this.execute(getWindowDimensions).then(function (response) {
      return response.value
    })
  })

  this.client.addCommand('getWindowWidth', function () {
    return this.getWindowDimensions().then(function (dimensions) {
      return dimensions.width
    })
  })

  this.client.addCommand('getWindowHeight', function () {
    return this.getWindowDimensions().then(function (dimensions) {
      return dimensions.height
    })
  })

  this.client.addCommand('setWindowDimensions', function (x, y, width, height) {
    return this.execute(function (x, y, width, height) {
      var currentWindow = require('remote').getCurrentWindow()
      if (x != null && y != null) {
        currentWindow.setPosition(x, y)
      }
      if (width != null && height != null) {
        currentWindow.setSize(width, height)
      }
    }, x, y, width, height)
  })

  this.client.addCommand('waitUntilTextExists', function (selector, text, timeout) {
    if (timeout == null) timeout = 5000

    return this.waitUntil(function () {
      return this.isExisting(selector).getText(selector).then(function (selectorText) {
        return selectorText.indexOf(text) !== -1
      })
    }, timeout).then(function () { })
  })

  this.client.addCommand('quitApplication', function () {
    return this.execute(function () {
      require('remote').require('app').quit()
    })
  })

  this.client.addCommand('waitUntilWindowLoaded', function (timeout) {
    if (timeout == null) timeout = 5000

    return this.waitUntil(function () {
      return this.isWindowLoading().then(function (loading) {
        return !loading
      })
    }, timeout).then(function () { })
  })

  this.client.addCommand('getWindowCount', function () {
    return this.windowHandles().then(function (response) {
      return response.value.length
    })
  })

  this.addCurrentWindowGetter('isDevToolsOpened', 'isWindowDevToolsOpened')
  this.addCurrentWindowGetter('isFocused', 'isWindowFocused')
  this.addCurrentWindowGetter('isFullScreen', 'isWindowFullScreen')
  this.addCurrentWindowGetter('isMaximized', 'isWindowMaximized')
  this.addCurrentWindowGetter('isMinimized', 'isWindowMinimized')
  this.addCurrentWindowGetter('isLoading', 'isWindowLoading')
  this.addCurrentWindowGetter('isVisible', 'isWindowVisible')

  this.addCurrentWindowGetter('hide', 'hideWindow')
  this.addCurrentWindowGetter('maximize', 'maximizeWindow')
  this.addCurrentWindowGetter('minimize', 'minimizeWindow')
  this.addCurrentWindowGetter('show', 'showWindow')
}

Application.prototype.addCurrentWindowGetter = function (methodName, commandName) {
  if (!commandName) commandName = methodName

  var currentWindowGetter = function (methodName) {
    return require('remote').getCurrentWindow()[methodName]()
  }

  this.client.addCommand(commandName, function () {
    return this.execute(currentWindowGetter, methodName).then(function (response) {
      return response.value
    })
  })
}

module.exports = Application
