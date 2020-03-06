const apiCache = {}

class Api {
  constructor (app, requireName) {
    this.app = app
    this.requireName = requireName
  }

  initialize () {
    return this.load().then(this.addApiCommands.bind(this))
  }

  addApiCommands (api) {
    if (!this.nodeIntegration) return

    this.addRenderProcessApis(api.electron)
    this.addMainProcessApis(api.electron.remote)
    this.addBrowserWindowApis(api.browserWindow)
    this.addWebContentsApis(api.webContents)
    this.addProcessApis(api.rendererProcess)

    this.api = {
      browserWindow: api.browserWindow,
      electron: api.electron,
      rendererProcess: api.rendererProcess,
      webContents: api.webContents
    }

    this.addClientProperties()
  }

  load () {
    return this.isNodeIntegrationEnabled().then((nodeIntegration) => {
      this.nodeIntegration = nodeIntegration
      if (!nodeIntegration) {
        return {
          electron: { remote: {} },
          browserWindow: {},
          webContents: {},
          rendererProcess: {}
        }
      }

      return this.getVersion().then((version) => {
        const api = apiCache[version]
        if (api) return api

        return this.loadApi().then((api) => {
          if (version) apiCache[version] = api
          return api
        })
      })
    })
  }

  isNodeIntegrationEnabled () {
    return this.app.client.execute((requireName) => {
      return typeof window[requireName] === 'function'
    }, this.requireName).then(getResponseValue)
  }

  getVersion () {
    return this.app.client.execute((requireName) => {
      const process = window[requireName]('process')
      if (process != null && process.versions != null) {
        return process.versions.electron
      }
    }, this.requireName).then(getResponseValue)
  }

  loadApi () {
    return this.app.client.execute((requireName) => {
      if (typeof window[requireName] !== 'function') {
        throw new Error('Could not find global require method with name: ' + requireName)
      }
      const electron = window[requireName]('electron')
      const process = window[requireName]('process')

      const api = {
        browserWindow: {},
        electron: {},
        rendererProcess: {},
        webContents: {}
      }

      const ignoreModule = (moduleName) => {
        switch (moduleName) {
          case 'CallbacksRegistry':
          case 'deprecate':
          case 'deprecations':
          case 'hideInternalModules':
          case 'Tray':
            return true
          case 'inAppPurchase':
            return process.platform !== 'darwin'
        }
        return false
      }

      const isRemoteFunction = (name) => {
        switch (name) {
          case 'BrowserWindow':
          case 'Menu':
          case 'MenuItem':
            return false
        }
        return typeof electron.remote[name] === 'function'
      }

      const ignoreApi = (apiName) => {
        switch (apiName) {
          case 'prototype':
            return true
          default:
            return apiName[0] === '_'
        }
      }

      const addModule = (parent, parentName, name, api) => {
        api[name] = {}
        for (const key in parent[name]) {
          if (ignoreApi(key)) continue
          api[name][key] = parentName + '.' + name + '.' + key
        }
      }

      const addRenderProcessModules = () => {
        Object.getOwnPropertyNames(electron).forEach((key) => {
          if (ignoreModule(key)) return
          if (key === 'remote') return
          addModule(electron, 'electron', key, api.electron)
        })
      }

      const addMainProcessModules = () => {
        api.electron.remote = {}
        Object.getOwnPropertyNames(electron.remote).forEach((key) => {
          if (ignoreModule(key)) return
          if (isRemoteFunction(key)) {
            api.electron.remote[key] = 'electron.remote.' + key
          } else {
            addModule(electron.remote, 'electron.remote', key, api.electron.remote)
          }
        })
        addModule(electron.remote, 'electron.remote', 'process', api.electron.remote)
      }

      const addBrowserWindow = () => {
        const currentWindow = electron.remote.getCurrentWindow()
        for (const name in currentWindow) {
          if (ignoreApi(name)) continue
          const value = currentWindow[name]
          if (typeof value === 'function') {
            api.browserWindow[name] = 'browserWindow.' + name
          }
        }
      }

      const addWebContents = () => {
        const webContents = electron.remote.getCurrentWebContents()
        for (const name in webContents) {
          if (ignoreApi(name)) continue
          const value = webContents[name]
          if (typeof value === 'function') {
            api.webContents[name] = 'webContents.' + name
          }
        }
      }

      const addProcess = () => {
        if (typeof process !== 'object') return

        for (const name in process) {
          if (ignoreApi(name)) continue
          api.rendererProcess[name] = 'process.' + name
        }
      }

      addRenderProcessModules()
      addMainProcessModules()
      addBrowserWindow()
      addWebContents()
      addProcess()

      return api
    }, this.requireName).then(getResponseValue)
  }

  addClientProperty (name) {
    const self = this
    const clientPrototype = Object.getPrototypeOf(this.app.client)
    Object.defineProperty(clientPrototype, name, {
      get: function () {
        const client = this
        return transformObject(self.api[name], {}, (value) => {
          return client[value].bind(client)
        })
      }
    })
  }

  addClientProperties () {
    this.addClientProperty('electron')
    this.addClientProperty('browserWindow')
    this.addClientProperty('webContents')
    this.addClientProperty('rendererProcess')

    Object.defineProperty(Object.getPrototypeOf(this.app.client), 'mainProcess', {
      get: function () {
        return this.electron.remote.process
      }
    })
  }

  addRenderProcessApis (api) {
    const electron = {}
    this.app.electron = electron

    Object.keys(api).forEach((moduleName) => {
      if (moduleName === 'remote') return
      electron[moduleName] = {}
      const moduleApi = api[moduleName]

      Object.keys(moduleApi).forEach((key) => {
        const commandName = moduleApi[key]

        this.app.client.addCommand(commandName, (...args) => {
          return this.app.client.execute(callRenderApi, moduleName, key, args, this.requireName).then(getResponseValue)
        })

        electron[moduleName][key] = (...args) => {
          return this.app.client[commandName].apply(this.app.client, args)
        }
      })
    })
  }

  addMainProcessApis (api) {
    const remote = {}
    this.app.electron.remote = remote

    Object.keys(api).filter((propertyName) => {
      return typeof api[propertyName] === 'string'
    }).forEach((name) => {
      const commandName = api[name]

      this.app.client.addCommand(commandName, (...args) => {
        return this.app.client.execute(callMainApi, null, name, args, this.requireName).then(getResponseValue)
      })

      remote[name] = (...args) => {
        return this.app.client[commandName].apply(this.app.client, args)
      }
    })

    Object.keys(api).filter((moduleName) => {
      return typeof api[moduleName] === 'object'
    }).forEach((moduleName) => {
      remote[moduleName] = {}
      const moduleApi = api[moduleName]

      Object.keys(moduleApi).forEach((key) => {
        const commandName = moduleApi[key]

        this.app.client.addCommand(commandName, (...args) => {
          return this.app.client.execute(callMainApi, moduleName, key, args, this.requireName).then(getResponseValue)
        })

        remote[moduleName][key] = (...args) => {
          return this.app.client[commandName].apply(this.app.client, args)
        }
      })
    })
  }

  addBrowserWindowApis (api) {
    this.app.browserWindow = {}

    const asyncApis = {
      'browserWindow.capturePage': true
    }

    Object.keys(api).filter((name) => {
      return !asyncApis.hasOwnProperty(api[name])
    }).forEach((name) => {
      const commandName = api[name]

      this.app.client.addCommand(commandName, (...args) => {
        return this.app.client.execute(callBrowserWindowApi, name, args, this.requireName).then(getResponseValue)
      })

      this.app.browserWindow[name] = (...args) => {
        return this.app.client[commandName].apply(this.app.client, args)
      }
    })

    this.addCapturePageSupport()
  }

  addCapturePageSupport () {
    this.app.client.addCommand('browserWindow.capturePage', (rect) => {
      return this.app.client.executeAsync(async (rect, requireName, done) => {
        const args = []
        if (rect != null) args.push(rect)
        const browserWindow = window[requireName]('electron').remote.getCurrentWindow()
        const image = await browserWindow.capturePage.apply(browserWindow, args)
        if (image != null) {
          done(image.toPNG().toString('base64'))
        } else {
          done(image)
        }
      }, rect, this.requireName).then(getResponseValue).then((image) => {
        return Buffer.from(image, 'base64')
      })
    })

    this.app.browserWindow.capturePage = (...args) => {
      return this.app.client['browserWindow.capturePage'].apply(this.app.client, args)
    }
  }

  addWebContentsApis (api) {
    this.app.webContents = {}

    const asyncApis = {
      'webContents.savePage': true,
      'webContents.executeJavaScript': true
    }

    Object.keys(api).filter((name) => {
      return !asyncApis.hasOwnProperty(api[name])
    }).forEach((name) => {
      const commandName = api[name]

      this.app.client.addCommand(commandName, (...args) => {
        return this.app.client.execute(callWebContentsApi, name, args, this.requireName).then(getResponseValue)
      })

      this.app.webContents[name] = (...args) => {
        return this.app.client[commandName].apply(this.app.client, args)
      }
    })

    this.addSavePageSupport()
    this.addExecuteJavaScriptSupport()
  }

  addSavePageSupport () {
    this.app.client.addCommand('webContents.savePage', (fullPath, saveType) => {
      return this.app.client.executeAsync(async (fullPath, saveType, requireName, done) => {
        const webContents = window[requireName]('electron').remote.getCurrentWebContents()
        await webContents.savePage(fullPath, saveType)
        done()
      }, fullPath, saveType, this.requireName).then(getResponseValue).then((rawError) => {
        if (rawError) {
          const error = new Error(rawError.message)
          if (rawError.name) error.name = rawError.name
          throw error
        }
      })
    })

    this.app.webContents.savePage = (...args) => {
      return this.app.client['webContents.savePage'].apply(this.app.client, args)
    }
  }

  addExecuteJavaScriptSupport () {
    this.app.client.addCommand('webContents.executeJavaScript', (code, useGesture) => {
      return this.app.client.executeAsync(async (code, useGesture, requireName, done) => {
        const webContents = window[requireName]('electron').remote.getCurrentWebContents()
        const result = await webContents.executeJavaScript(code, useGesture)
        done(result)
      }, code, useGesture, this.requireName).then(getResponseValue)
    })

    this.app.webContents.executeJavaScript = (...args) => {
      return this.app.client['webContents.executeJavaScript'].apply(this.app.client, args)
    }
  }

  addProcessApis (api) {
    this.app.rendererProcess = {}

    Object.keys(api).forEach((name) => {
      const commandName = api[name]

      this.app.client.addCommand(commandName, (...args) => {
        return this.app.client.execute(callProcessApi, name, args).then(getResponseValue)
      })

      this.app.rendererProcess[name] = (...args) => {
        return this.app.client[commandName].apply(this.app.client, args)
      }
    })

    this.app.mainProcess = this.app.electron.remote.process
  }

  transferPromiseness (target, promise) {
    this.app.client.transferPromiseness(target, promise)

    if (!this.nodeIntegration) return

    const addProperties = (source, target, moduleName) => {
      const sourceModule = source[moduleName]
      if (!sourceModule) return
      target[moduleName] = transformObject(sourceModule, {}, (value, parent) => {
        return value.bind(parent)
      })
    }

    addProperties(promise, target, 'webContents')
    addProperties(promise, target, 'browserWindow')
    addProperties(promise, target, 'electron')
    addProperties(promise, target, 'mainProcess')
    addProperties(promise, target, 'rendererProcess')
  }

  logApi () {
    const fs = require('fs')
    const path = require('path')
    const json = JSON.stringify(this.api, null, 2)
    fs.writeFileSync(path.join(__dirname, 'api.json'), json)
  }
}

const transformObject = (input, output, callback) => {
  Object.keys(input).forEach((name) => {
    const value = input[name]
    if (typeof value === 'object') {
      output[name] = {}
      transformObject(value, output[name], callback)
    } else {
      output[name] = callback(value, input)
    }
  })
  return output
}

const callRenderApi = (moduleName, api, args, requireName) => {
  const module = window[requireName]('electron')[moduleName]
  if (typeof module[api] === 'function') {
    return module[api].apply(module, args)
  } else {
    return module[api]
  }
}

const callMainApi = (moduleName, api, args, requireName) => {
  let module = window[requireName]('electron').remote
  if (moduleName) {
    module = module[moduleName]
  }
  if (typeof module[api] === 'function') {
    return module[api].apply(module, args)
  } else {
    return module[api]
  }
}

const callWebContentsApi = (name, args, requireName) => {
  const webContents = window[requireName]('electron').remote.getCurrentWebContents()
  return webContents[name].apply(webContents, args)
}

const callBrowserWindowApi = (name, args, requireName) => {
  const browserWindow = window[requireName]('electron').remote.getCurrentWindow()
  return browserWindow[name].apply(browserWindow, args)
}

const callProcessApi = (name, args) => {
  if (typeof process[name] === 'function') {
    return process[name].apply(process, args)
  } else {
    return process[name]
  }
}

const getResponseValue = (response) => {
  return response.value
}

module.exports = Api
