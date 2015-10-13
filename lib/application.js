var WebDriver = require('webdriverio')
var ChromeDriver = require('./chrome-driver')

function Application (options) {
  options = options || {}
  this.host = options.host || 'localhost'
  this.port = parseInt(options.port, 10) || 9515
  this.quitTimeout = parseInt(options.quitTimeout, 10) || 1000

  this.path = options.path
  this.args = options.args || []
}

Application.prototype.start = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    self.startChromeDriver(function () {
      self.createClient(function () {
        resolve()
      })
    })
  })
}

Application.prototype.stop = function (callback) {
  var self = this
  return new Promise(function (resolve, reject) {
    self.client.quitApplication().then(function () {
      setTimeout(function () {
        self.client.end().then(function () {
          self.chromeDriver.stop()
          resolve()
        })
      }, self.quitTimeout)
    })
  })
}

Application.prototype.startChromeDriver = function (callback) {
  var self = this
  self.chromeDriver = new ChromeDriver(this.host, this.port)
  self.chromeDriver.start()

  var waitUntilRunning = function () {
    self.chromeDriver.isRunning(function (running) {
      if (running) return callback(self.chromeDriver)
      setTimeout(waitUntilRunning, 100)
    })
  }
  waitUntilRunning()
}

Application.prototype.createClient = function (callback) {
  var options = {
    host: this.host,
    port: this.port,
    desiredCapabilities: {
      browserName: 'electron',
      chromeOptions: {
        binary: this.path,
        args: this.args
      }
    }
  }

  var self = this
  self.client = WebDriver.remote(options)
  self.addCommands()
  self.client.init().then(function () { callback() })
  self.client.on('error', function (error) {
    console.error('Client Error', error.message)
    self.client.end().then(function () {
      self.chromeDriver.stop()
    })
  })
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

  this.client.addCommand('setWindowDimensions', function (x, y, width, height) {
    return this.execute(function (x, y, width, height) {
      if (x != null && y != null) {
        require('remote').getCurrentWindow().setPosition(x, y)
      }
      if (width != null && height != null) {
        require('remote').getCurrentWindow().setSize(width, height)
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

  this.addCurrentWindowGetter('isFocused')
  this.addCurrentWindowGetter('isVisible', 'isWindowVisible')
  this.addCurrentWindowGetter('isLoading', 'isWindowLoading')
  this.addCurrentWindowGetter('isDevToolsOpened')
  this.addCurrentWindowGetter('isFullScreen')
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
