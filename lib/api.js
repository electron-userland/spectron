function Api (app) {
  this.app = app
  this.commands = {}
}

Api.prototype.transferPromiseness = function (target, promise) {
  var self = this

  self.app.client.transferPromiseness(target, promise)

  target.electron = {}
  target.browserWindow = {}

  Object.keys(this.commands).forEach(function (command) {
    var apiPath = self.commands[command]
    var api = target.electron

    apiPath.slice(0, -1).forEach(function (segment) {
      if (!api[segment]) api[segment] = {}
      api = api[segment]
    })

    api[apiPath[apiPath.length - 1]] = target[command].bind(target)
  })

  var browserWindow = promise.browserWindow
  Object.keys(browserWindow).forEach(function (name) {
    target.browserWindow[name] = browserWindow[name].bind(promise)
  })
}

Api.prototype.initialize = function () {
  var self = this
  return this.load(self.app).then(getResponseValue).then(function (api) {
    self.app.electron = {}
    self.app.browserWindow = {}
    self.add(self.app.electron, [], api.electron)
    self.addBrowserWindowApis(api.browserWindow)

    // Add electron property to client prototype so promises can be chained
    var clientPrototype = Object.getPrototypeOf(self.app.client)
    clientPrototype.electron = self.app.electron

    Object.defineProperty(clientPrototype, 'browserWindow', {
      get: function () {
        var api = {}
        var client = this
        Object.keys(self.app.browserWindow).forEach(function (key) {
          api[key] = client['browserWindow.' + key].bind(client)
        })
        return api
      }
    });
  })
}

Api.prototype.load = function (app) {
  return app.client.execute(function () {
    var electron = require('electron')

    function ignoreModule (moduleName) {
      switch (moduleName) {
        case 'deprecate':
        case 'deprecations':
        case 'hideInternalModules':
          return true
      }
      return false
    }

    function addProperties (parent, api) {
      Object.getOwnPropertyNames(parent).forEach(function (key) {
        if (ignoreModule(key)) return

        var module = parent[key]
        api[key] = {}

        Object.getOwnPropertyNames(module).forEach(function (moduleKey) {
          var value = module[moduleKey]
          if (typeof value === 'function') {
            api[key][moduleKey] = 'function'
          }
        })
      })
    }

    function addBrowserWindow (api) {
      var currentWindow = electron.remote.getCurrentWindow()
      for (var name in currentWindow) {
        var value = currentWindow[name]
        if (typeof value === 'function') {
          api[name] = 'function'
        }
      }
    }

    var api = {
      electron: {},
      browserWindow: {},
      webContents: {}
    }

    addProperties(electron, api.electron)
    addProperties(electron.remote, api.electron.remote)
    addBrowserWindow(api.browserWindow)

    return api
  })
}

Api.prototype.add = function (parent, parentSegments, api) {
  var self = this
  var app = self.app

  Object.keys(api).forEach(function (key) {
    var segments = parentSegments.concat(key)
    var commandName = 'electron.' + segments.join('.')
    var value = api[key]

    if (value === 'function') {
      self.commands[commandName] = segments
      app.client.addCommand(commandName, function () {
        var args = Array.prototype.slice.call(arguments)
        return this.execute(callApi, segments, args).then(getResponseValue)
      })
      parent[key] = function () {
        return app.client[commandName].apply(app.client, arguments)
      }
    } else {
      parent[key] = {}
      self.add(parent[key], segments, value)
    }
  })
}

Api.prototype.addBrowserWindowApis = function (api) {
  var app = this.app
  app.browserWindow = {}

  Object.keys(api).forEach(function (name) {
    var commandName = 'browserWindow.' + name

    app.client.addCommand(commandName, function () {
      var args = Array.prototype.slice.call(arguments)
      return this.execute(callBrowserWindowApi, name, args).then(getResponseValue)
    })

    app.browserWindow[name] = function () {
      return app.client[commandName].apply(app.client, arguments)
    }
  })
}

function callBrowserWindowApi (name, args) {
  var window = require('electron').remote.getCurrentWindow()
  return window[name].apply(window, args)
}

function callApi (segments, args) {
  var api = require('electron')

  segments.forEach(function (segment, index) {
    api = api[segment]
    if (api === 'function' && index < segments.length - 1) {
      api = api()
    }
  })

  return api.apply(api, args)
}

function getResponseValue (response) {
  return response.value
}

module.exports = Api
