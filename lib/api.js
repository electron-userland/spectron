exports.initialize = function (app) {
  return getApis(app).then(getResponseValue).then(function (api) {
    console.log(api);
    app.electron = {}
    addApi(app, app.electron, [], api)
  })
}

function getApis (app) {
  return app.client.execute(function () {
    var electron = require('electron')
    var api = {}

    Object.getOwnPropertyNames(electron).forEach(function (key) {
      var module = electron[key]
      api[key] = {}
      Object.getOwnPropertyNames(module).forEach(function (moduleKey) {
        var value = module[moduleKey]
        if (typeof value === 'function') {
          api[key][moduleKey] = 'function'
        }
      })
    })

    return api
  })
}

function addApi (app, parent, parentSegments, api) {
  Object.keys(api).forEach(function (key) {
    var segments = parentSegments.concat(key)
    var commandName = 'electron.' + segments.join('.')
    var value = api[key]

    if (value === 'function') {
      app.client.addCommand(commandName, function () {
        var args = Array.prototype.slice.call(arguments)
        return this.execute.call(this, callApi, segments, args)
          .then(getResponseValue)
      })
      parent[key] = function () {
        return app.client[commandName].apply(app.client, arguments)
      }
    } else {
      parent[key] = {}
      addApi(app, parent[key], segments, value)
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
