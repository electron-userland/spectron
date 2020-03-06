const Accessibility = require('./accessibility')
const Api = require('./api')
const ChromeDriver = require('./chrome-driver')
const DevNull = require('dev-null')
const fs = require('fs')
const path = require('path')
const WebDriver = require('webdriverio')

class Application {
  constructor (options) {
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
    this.chromeDriverArgs = options.chromeDriverArgs || []
    this.env = options.env || {}
    this.workingDirectory = options.cwd || process.cwd()
    this.debuggerAddress = options.debuggerAddress
    this.chromeDriverLogPath = options.chromeDriverLogPath
    this.webdriverLogPath = options.webdriverLogPath
    this.webdriverOptions = options.webdriverOptions || {}
    this.requireName = options.requireName || 'require'

    this.api = new Api(this, this.requireName)
    this.setupPromiseness()
  }

  setupPromiseness () {
    this.transferPromiseness = (target, promise) => {
      this.api.transferPromiseness(target, promise)
    }
  }

  start () {
    return this.exists()
      .then(() => { return this.startChromeDriver() })
      .then(() => { return this.createClient() })
      .then(() => { return this.api.initialize() })
      .then(() => { return this.client.timeouts('script', this.waitTimeout) })
      .then(() => { this.running = true })
      .then(() => { return this })
  }

  stop () {
    if (!this.isRunning()) return Promise.reject(Error('Application not running'))

    return new Promise((resolve, reject) => {
      const endClient = () => {
        setTimeout(() => {
          this.client.end().then(() => {
            this.chromeDriver.stop()
            this.running = false
            resolve(this)
          }, reject)
        }, this.quitTimeout)
      }

      if (this.api.nodeIntegration) {
        this.client.windowByIndex(0).electron.remote.app.quit().then(endClient, reject)
      } else {
        this.client.windowByIndex(0).execute(() => {
          window.close()
        }).then(endClient, reject)
      }
    })
  }

  restart () {
    return this.stop().then(() => {
      return this.start()
    })
  }

  isRunning () {
    return this.running
  }

  getSettings () {
    return {
      host: this.host,
      port: this.port,
      quitTimeout: this.quitTimeout,
      startTimeout: this.startTimeout,
      waitTimeout: this.waitTimeout,
      connectionRetryCount: this.connectionRetryCount,
      connectionRetryTimeout: this.connectionRetryTimeout,
      nodePath: this.nodePath,
      path: this.path,
      args: this.args,
      chromeDriverArgs: this.chromeDriverArgs,
      env: this.env,
      workingDirectory: this.workingDirectory,
      debuggerAddress: this.debuggerAddress,
      chromeDriverLogPath: this.chromeDriverLogPath,
      webdriverLogPath: this.webdriverLogPath,
      webdriverOptions: this.webdriverOptions,
      requireName: this.requireName
    }
  }

  exists () {
    return new Promise((resolve, reject) => {
      // Binary path is ignored by ChromeDriver if debuggerAddress is set
      if (this.debuggerAddress) return resolve()

      if (typeof this.path !== 'string') {
        return reject(Error('Application path must be a string'))
      }

      fs.stat(this.path, (error, stat) => {
        if (error) return reject(error)
        if (stat.isFile()) return resolve()
        reject(Error('Application path specified is not a file: ' + this.path))
      })
    })
  }

  startChromeDriver () {
    this.chromeDriver = new ChromeDriver(this.host, this.port, this.nodePath, this.startTimeout, this.workingDirectory, this.chromeDriverLogPath)
    return this.chromeDriver.start()
  }

  createClient () {
    return new Promise((resolve, reject) => {
      const args = []
      args.push('spectron-path=' + this.path)
      this.args.forEach((arg, index) => {
        args.push('spectron-arg' + index + '=' + arg)
      })

      for (const name in this.env) {
        args.push('spectron-env-' + name + '=' + this.env[name])
      }

      this.chromeDriverArgs.forEach((arg) => {
        args.push(arg)
      })

      const isWin = process.platform === 'win32'
      const launcherPath = path.join(__dirname, isWin ? 'launcher.bat' : 'launcher.js')

      if (process.env.APPVEYOR) {
        args.push('no-sandbox')
      }

      const options = {
        host: this.host,
        port: this.port,
        waitforTimeout: this.waitTimeout,
        connectionRetryCount: this.connectionRetryCount,
        connectionRetryTimeout: this.connectionRetryTimeout,
        desiredCapabilities: {
          browserName: 'electron',
          chromeOptions: {
            binary: launcherPath,
            args: args,
            debuggerAddress: this.debuggerAddress,
            windowTypes: ['app', 'webview']
          }
        },
        logOutput: DevNull()
      }

      if (this.webdriverLogPath) {
        options.logOutput = this.webdriverLogPath
        options.logLevel = 'verbose'
      }

      Object.assign(options, this.webdriverOptions)

      this.client = WebDriver.remote(options)
      this.addCommands()
      this.initializeClient(resolve, reject)
    })
  }

  initializeClient (resolve, reject) {
    const maxTries = 10
    let tries = 0
    const init = () => {
      tries++
      this.client.init().then(resolve, (error) => {
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

  addCommands () {
    this.client.addCommand('waitUntilTextExists', (selector, text, timeout) => {
      return this.client.waitUntil(() => {
        return this.client.isExisting(selector).then((exists) => {
          if (!exists) return false
          return this.client.getText(selector).then((selectorText) => {
            return Array.isArray(selectorText) ? selectorText.some(s => s.includes(text)) : selectorText.includes(text)
          })
        })
      }, timeout).then(() => { }, (error) => {
        error.message = 'waitUntilTextExists ' + error.message
        throw error
      })
    })

    /**
     * Utility from webdriverio v5
     * https://github.com/webdriverio/webdriverio/blob/v5.9.4/packages/webdriverio/src/commands/browser/switchWindow.js
     */
    this.client.addCommand('switchWindow', async (urlOrTitleToMatch) => {
      if (typeof urlOrTitleToMatch !== 'string' && !(urlOrTitleToMatch instanceof RegExp)) {
        throw new TypeError('Invalid parameter urlOrTitleToMatch: expected a string or a RegExp')
      }

      const tabs = await this.client.windowHandles().then(getResponseValue)

      for (const tab of tabs) {
        await this.client.window(tab)

        /**
         * check if url matches
         */
        const url = await this.client.getUrl()
        if (url.match(urlOrTitleToMatch)) {
          return tab
        }

        /**
         * check title
         */
        const title = await this.client.getTitle()
        if (title.match(urlOrTitleToMatch)) {
          return tab
        }
      }

      throw new Error(`No window found with title or url matching "${urlOrTitleToMatch}"`)
    })

    this.client.addCommand('waitUntilWindowLoaded', (timeout) => {
      return this.client.waitUntil(() => {
        return this.webContents.isLoading().then((loading) => {
          return !loading
        })
      }, timeout).then(() => { }, (error) => {
        error.message = 'waitUntilWindowLoaded ' + error.message
        throw error
      })
    })

    this.client.addCommand('getWindowCount', () => {
      return this.client.windowHandles().then(getResponseValue).then((handles) => {
        return handles.length
      })
    })

    this.client.addCommand('windowByIndex', (index) => {
      return this.client.windowHandles().then(getResponseValue).then((handles) => {
        return this.client.window(handles[index])
      })
    })

    this.client.addCommand('getSelectedText', () => {
      return this.client.execute(() => {
        return window.getSelection().toString()
      }).then(getResponseValue)
    })

    this.client.addCommand('getRenderProcessLogs', () => {
      return this.client.log('browser').then(getResponseValue)
    })

    this.client.addCommand('getMainProcessLogs', () => {
      const logs = this.chromeDriver.getLogs()
      this.chromeDriver.clearLogs()
      return logs
    })

    Accessibility.addCommand(this.client, this.requireName)
  }
}

const getResponseValue = (response) => {
  return response.value
}

module.exports = Application
