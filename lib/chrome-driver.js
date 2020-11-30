const ChildProcess = require('child_process');
const path = require('path');
const { default: got } = require('got');
const split = require('split');

class ChromeDriver {
  constructor(
    host,
    port,
    nodePath,
    startTimeout,
    workingDirectory,
    chromeDriverLogPath
  ) {
    this.host = host;
    this.port = port;
    this.nodePath = nodePath;
    this.startTimeout = startTimeout;
    this.workingDirectory = workingDirectory;
    this.chromeDriverLogPath = chromeDriverLogPath;

    this.path = require.resolve('electron-chromedriver/chromedriver');
    this.urlBase = '/';
    this.statusUrl = `http://${this.host}:${this.port}${this.urlBase}status`;
    this.logLines = [];
  }

  start() {
    if (this.process) throw new Error('ChromeDriver already started');

    const args = [
      this.path,
      `--port=${this.port}`,
      `--url-base=${this.urlBase}`
    ];

    if (this.chromeDriverLogPath) {
      args.push('--verbose');
      args.push(`--log-path=${this.chromeDriverLogPath}`);
    }
    const options = {
      cwd: this.workingDirectory,
      env: this.getEnvironment()
    };
    this.process = ChildProcess.spawn(this.nodePath, args, options);

    const self = this;
    this.exitHandler = () => {
      self.stop();
    };
    global.process.on('exit', this.exitHandler);

    this.setupLogs();
    return this.waitUntilRunning();
  }

  waitUntilRunning() {
    const self = this;
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkIfRunning = () => {
        self.isRunning((running) => {
          if (!self.process) {
            return reject(Error('ChromeDriver has been stopped'));
          }

          if (running) {
            return resolve();
          }

          const elapsedTime = Date.now() - startTime;
          if (elapsedTime > self.startTimeout) {
            return reject(
              Error(`ChromeDriver did not start within ${self.startTimeout}ms`)
            );
          }

          global.setTimeout(checkIfRunning, 100);
        });
      };
      checkIfRunning();
    });
  }

  setupLogs() {
    const linesToIgnore = 2; // First two lines are ChromeDriver specific
    let lineCount = 0;

    this.logLines = [];

    const self = this;
    this.process.stdout.pipe(split()).on('data', (line) => {
      if (lineCount < linesToIgnore) {
        lineCount++;
        return;
      }
      self.logLines.push(line);
    });
  }

  getEnvironment() {
    const env = {};
    Object.keys(process.env).forEach((key) => {
      env[key] = process.env[key];
    });

    if (process.platform === 'win32') {
      env.SPECTRON_NODE_PATH = process.execPath;
      env.SPECTRON_LAUNCHER_PATH = path.join(__dirname, 'launcher.js');
    }

    return env;
  }

  stop() {
    if (this.exitHandler) {
      global.process.removeListener('exit', this.exitHandler);
    }
    this.exitHandler = null;

    if (this.process) this.process.kill();
    this.process = null;

    this.clearLogs();
  }

  isRunning(callback) {
    const cb = false;
    got(this.statusUrl)
      .json()
      .then(({ value }) => callback(value && value.ready))
      .catch(() => callback(cb));
  }

  getLogs() {
    return this.logLines.slice();
  }

  clearLogs() {
    this.logLines = [];
  }
}

module.exports = ChromeDriver;
