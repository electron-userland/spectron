const ChildProcess = require('child_process');
const path = require('path');
const request = require('request');
const split = require('split');

function ChromeDriver(
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
  this.statusUrl =
    'http://' + this.host + ':' + this.port + this.urlBase + 'status';
  this.logLines = [];
}

ChromeDriver.prototype.start = function () {
  if (this.process) throw new Error('ChromeDriver already started');

  const args = [this.path, '--port=' + this.port, '--url-base=' + this.urlBase];

  if (this.chromeDriverLogPath) {
    args.push('--verbose');
    args.push('--log-path=' + this.chromeDriverLogPath);
  }
  const options = {
    cwd: this.workingDirectory,
    env: this.getEnvironment()
  };
  this.process = ChildProcess.spawn(this.nodePath, args, options);

  const self = this;
  this.exitHandler = function () {
    self.stop();
  };
  global.process.on('exit', this.exitHandler);

  this.setupLogs();
  return this.waitUntilRunning();
};

ChromeDriver.prototype.waitUntilRunning = function () {
  const self = this;
  return new Promise(function (resolve, reject) {
    const startTime = Date.now();
    const checkIfRunning = function () {
      self.isRunning(function (running) {
        if (!self.process) {
          return reject(Error('ChromeDriver has been stopped'));
        }

        if (running) {
          return resolve();
        }

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > self.startTimeout) {
          return reject(
            Error(
              'ChromeDriver did not start within ' + self.startTimeout + 'ms'
            )
          );
        }

        global.setTimeout(checkIfRunning, 100);
      });
    };
    checkIfRunning();
  });
};

ChromeDriver.prototype.setupLogs = function () {
  const linesToIgnore = 2; // First two lines are ChromeDriver specific
  let lineCount = 0;

  this.logLines = [];

  const self = this;
  this.process.stdout.pipe(split()).on('data', function (line) {
    if (lineCount < linesToIgnore) {
      lineCount++;
      return;
    }
    self.logLines.push(line);
  });
};

ChromeDriver.prototype.getEnvironment = function () {
  const env = {};
  Object.keys(process.env).forEach(function (key) {
    env[key] = process.env[key];
  });

  if (process.platform === 'win32') {
    env.SPECTRON_NODE_PATH = process.execPath;
    env.SPECTRON_LAUNCHER_PATH = path.join(__dirname, 'launcher.js');
  }

  return env;
};

ChromeDriver.prototype.stop = function () {
  if (this.exitHandler) global.process.removeListener('exit', this.exitHandler);
  this.exitHandler = null;

  if (this.process) this.process.kill();
  this.process = null;

  this.clearLogs();
};

ChromeDriver.prototype.isRunning = function (callback) {
  const cb = false;
  const requestOptions = {
    uri: this.statusUrl,
    json: true,
    followAllRedirects: true
  };
  request(requestOptions, function (error, response, body) {
    if (error) return callback(cb);
    if (response.statusCode !== 200) return callback(cb);
    callback(body && body.value.ready);
  });
};

ChromeDriver.prototype.getLogs = function () {
  return this.logLines.slice();
};

ChromeDriver.prototype.clearLogs = function () {
  this.logLines = [];
};

module.exports = ChromeDriver;
