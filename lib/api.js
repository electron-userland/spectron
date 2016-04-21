function Api (app) {
  this.app = app
  this.commands = {}
}

Api.prototype.transferPromiseness = function (target, promise) {
  var self = this

  self.app.client.transferPromiseness(target, promise)
  target.electron = {}

  Object.keys(this.commands).forEach(function (command) {
    var apiPath = self.commands[command]
    var api = target.electron

    apiPath.slice(0, -1).forEach(function (segment) {
      if (!api[segment]) api[segment] = {}
      api = api[segment]
    })

    api[apiPath[apiPath.length - 1]] = target[command].bind(target)
  })
}

Api.prototype.initialize = function () {
  var self = this
  return this.load(self.app).then(getResponseValue).then(function (api) {
    self.api = api
    self.app.electron = {}
    self.add(self.app.electron, [], api)

    // Add electron property to client prototype so promises can be chained
    Object.getPrototypeOf(self.app.client).electron = self.app.electron
  })
}

Api.prototype.load = function (app) {
  return app.client.execute(function () {
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

    var electron = require('electron')
    var api = {}

    addProperties(electron, api)
    addProperties(electron.remote, api.remote)

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
