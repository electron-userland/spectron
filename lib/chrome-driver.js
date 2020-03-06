const ChildProcess = require('child_process')
const path = require('path')
const request = require('request')
const split = require('split')

class ChromeDriver {
  constructor (host, port, nodePath, startTimeout, workingDirectory, chromeDriverLogPath) {
    this.host = host
    this.port = port
    this.nodePath = nodePath
    this.startTimeout = startTimeout
    this.workingDirectory = workingDirectory
    this.chromeDriverLogPath = chromeDriverLogPath

    this.path = require.resolve('electron-chromedriver/chromedriver')
    this.urlBase = '/wd/hub'
    this.statusUrl = 'http://' + this.host + ':' + this.port + this.urlBase + '/status'
    this.logLines = []
  }

  start () {
    if (this.process) throw new Error('ChromeDriver already started')

    const args = [
      this.path,
      '--port=' + this.port,
      '--url-base=' + this.urlBase
    ]

    if (this.chromeDriverLogPath) {
      args.push('--verbose')
      args.push('--log-path=' + this.chromeDriverLogPath)
    }
    const options = {
      cwd: this.workingDirectory,
      env: this.getEnvironment()
    }
    this.process = ChildProcess.spawn(this.nodePath, args, options)

    this.exitHandler = () => { this.stop() }
    global.process.on('exit', this.exitHandler)

    this.setupLogs()
    return this.waitUntilRunning()
  }

  waitUntilRunning () {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const checkIfRunning = () => {
        this.isRunning((running) => {
          if (!this.process) {
            return reject(Error('ChromeDriver has been stopped'))
          }

          if (running) {
            return resolve()
          }

          const elapsedTime = Date.now() - startTime
          if (elapsedTime > this.startTimeout) {
            return reject(Error('ChromeDriver did not start within ' + this.startTimeout + 'ms'))
          }

          global.setTimeout(checkIfRunning, 100)
        })
      }
      checkIfRunning()
    })
  }

  setupLogs () {
    const linesToIgnore = 2 // First two lines are ChromeDriver specific
    let lineCount = 0

    this.logLines = []

    this.process.stdout.pipe(split()).on('data', (line) => {
      if (lineCount < linesToIgnore) {
        lineCount++
        return
      }
      this.logLines.push(line)
    })
  }

  getEnvironment () {
    const env = {}
    Object.keys(process.env).forEach((key) => {
      env[key] = process.env[key]
    })

    if (process.platform === 'win32') {
      env.SPECTRON_NODE_PATH = process.execPath
      env.SPECTRON_LAUNCHER_PATH = path.join(__dirname, 'launcher.js')
    }

    return env
  }

  stop () {
    if (this.exitHandler) global.process.removeListener('exit', this.exitHandler)
    this.exitHandler = null

    if (this.process) this.process.kill()
    this.process = null

    this.clearLogs()
  }

  isRunning (callback) {
    const cb = false
    const requestOptions = {
      uri: this.statusUrl,
      json: true,
      followAllRedirects: true
    }
    request(requestOptions, (error, response, body) => {
      if (error) return callback(cb)
      if (response.statusCode !== 200) return callback(cb)
      callback(body && body.value.ready)
    })
  }

  getLogs () {
    return this.logLines.slice()
  }

  clearLogs () {
    this.logLines = []
  }
}

module.exports = ChromeDriver
