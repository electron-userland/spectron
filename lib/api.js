function Api (app) {
  this.app = app
}

Api.prototype.initialize = function () {
  var self = this
  return this.load(self.app).then(function (api) {
    self.addRenderProcessApis(api.render)
    self.addMainProcessApis(api.main)
    self.addBrowserWindowApis(api.browserWindow)
    self.addWebContentsApis(api.webContents)
    self.addClientProperties()
  })
}

Api.prototype.load = function (app) {
  return app.client.execute(function () {
    var electron = require('electron')

    var api = {
      render: {},
      main: {},
      browserWindow: {},
      webContents: {}
    }

    function ignoreModule (moduleName) {
      switch (moduleName) {
        case 'CallbacksRegistry':
        case 'deprecate':
        case 'deprecations':
        case 'hideInternalModules':
          return true
      }
      return false
    }

    function ignoreApi (apiName) {
      switch (apiName) {
        case 'prototype':
          return true
        default:
          return apiName[0] === '_'
      }
    }

    function addModule (parent, parentName, name, api) {
      api[name] = {}
      Object.getOwnPropertyNames(parent[name]).forEach(function (key) {
        if (ignoreApi(key)) return
        var value = parent[name][key]
        if (typeof value === 'function') {
          api[name][key] = parentName + '.' + name + '.' + key
        }
      })
    }

    function addRenderProcessModules () {
      Object.getOwnPropertyNames(electron).forEach(function (key) {
        if (ignoreModule(key)) return
        if (key === 'remote') return
        addModule(electron, 'electron', key, api.render)
      })
    }

    function addMainProcessModules () {
      Object.getOwnPropertyNames(electron.remote).forEach(function (key) {
        if (ignoreModule(key)) return
        addModule(electron.remote, 'electron.remote', key, api.main)
      })
    }

    function addBrowserWindow () {
      var currentWindow = electron.remote.getCurrentWindow()
      for (var name in currentWindow) {
        var value = currentWindow[name]
        if (typeof value === 'function') {
          api.browserWindow[name] = 'browserWindow.' + name
        }
      }
    }

    function addWebContents () {
      var webContents = electron.remote.getCurrentWebContents()
      for (var name in webContents) {
        var value = webContents[name]
        if (typeof value === 'function') {
          api.webContents[name] = 'webContents.' + name
        }
      }
    }

    addRenderProcessModules()
    addMainProcessModules()
    addBrowserWindow()
    addWebContents()

    return api
  }).then(getResponseValue)
}

Api.prototype.addClientProperties = function () {
  var self = this

  // Add electron property to client prototype so promises can be chained
  var clientPrototype = Object.getPrototypeOf(self.app.client)
  clientPrototype.electron = self.app.electron

  Object.defineProperty(clientPrototype, 'browserWindow', {
    get: function () {
      var browserWindow = {}
      var client = this
      Object.keys(self.app.browserWindow).forEach(function (key) {
        browserWindow[key] = client[api.browserWindow[key]].bind(client)
      })
      return browserWindow
    }
  })

  Object.defineProperty(clientPrototype, 'webContents', {
    get: function () {
      var webContents = {}
      var client = this
      Object.keys(self.app.webContents).forEach(function (key) {
        webContents[key] = client[api.webContents[key]].bind(client)
      })
      return webContents
    }
  })
}

Api.prototype.addRenderProcessApis = function (api) {
  var self = this
  var app = self.app
  var electron = {}
  app.electron = electron

  Object.keys(api).forEach(function (moduleName) {
    electron[moduleName] = {}
    var moduleApi = api[moduleName]

    Object.keys(moduleApi).forEach(function (key) {
      var commandName = moduleApi[key]

      app.client.addCommand(commandName, function () {
        var args = Array.prototype.slice.call(arguments)
        return this.execute(callRenderApi, moduleName, key, args).then(getResponseValue)
      })

      electron[moduleName][key] = function () {
        return app.client[commandName].apply(app.client, arguments)
      }
    })
  })
}

Api.prototype.addMainProcessApis = function (api) {
  var self = this
  var app = self.app
  var remote = {}
  app.electron.remote = remote

  Object.keys(api).forEach(function (moduleName) {
    remote[moduleName] = {}
    var moduleApi = api[moduleName]

    Object.keys(moduleApi).forEach(function (key) {
      var commandName = moduleApi[key]

      app.client.addCommand(commandName, function () {
        var args = Array.prototype.slice.call(arguments)
        return this.execute(callMainApi, moduleName, key, args).then(getResponseValue)
      })

      remote[moduleName][key] = function () {
        return app.client[commandName].apply(app.client, arguments)
      }
    })
  })
}

Api.prototype.addBrowserWindowApis = function (api) {
  var app = this.app
  app.browserWindow = {}

  Object.keys(api).forEach(function (name) {
    var commandName = api[name]

    app.client.addCommand(commandName, function () {
      var args = Array.prototype.slice.call(arguments)
      return this.execute(callBrowserWindowApi, name, args).then(getResponseValue)
    })

    app.browserWindow[name] = function () {
      return app.client[commandName].apply(app.client, arguments)
    }
  })
}

Api.prototype.addWebContentsApis = function (api) {
  var app = this.app
  app.webContents = {}

  Object.keys(api).forEach(function (name) {
    var commandName = api[name]

    app.client.addCommand(commandName, function () {
      var args = Array.prototype.slice.call(arguments)
      return this.execute(callWebContentsApi, name, args).then(getResponseValue)
    })

    app.webContents[name] = function () {
      return app.client[commandName].apply(app.client, arguments)
    }
  })
}

Api.prototype.transferPromiseness = function (target, promise) {
  this.app.client.transferPromiseness(target, promise)

  var addProperties = function (source, target, moduleName) {
    var api = source[moduleName]
    target[moduleName] = {}
    Object.keys(api).forEach(function (name) {
      target[moduleName][name] = api[name].bind(source)
    })
  }

  addProperties(promise, target, 'webContents')
  addProperties(promise, target, 'browserWindow')

  target.electron = {}
  Object.keys(promise.electron).forEach(function (moduleName) {
    if (moduleName === 'remote') return
    addProperties(promise.electron, target.electron, moduleName)
  })

  target.electron.remote = {}
  Object.keys(promise.electron.remote).forEach(function (moduleName) {
    addProperties(promise.electron.remote, target.electron.remote, moduleName)
  })
}

function callRenderApi (moduleName, api, args) {
  var module = require('electron')[moduleName]
  return module[api].apply(module, args)
}

function callMainApi (moduleName, api, args) {
  var module = require('electron').remote[moduleName]
  return module[api].apply(module, args)
}

function callWebContentsApi (name, args) {
  var webContents = require('electron').remote.getCurrentWebContents()
  return webContents[name].apply(webContents, args)
}

function callBrowserWindowApi (name, args) {
  var window = require('electron').remote.getCurrentWindow()
  return window[name].apply(window, args)
}

function getResponseValue (response) {
  return response.value
}

module.exports = Api
