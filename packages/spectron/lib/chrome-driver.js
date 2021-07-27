const ChildProcess = require('child_process');
const path = require('path');
const { default: got } = require('got');
const split = require('split');

function ChromeDriver(host, port, nodePath, startTimeout, workingDirectory, chromeDriverLogPath) {
  this.host = host;
  this.port = port;
  this.nodePath = nodePath;
  this.startTimeout = startTimeout;
  this.workingDirectory = workingDirectory;
  this.chromeDriverLogPath = chromeDriverLogPath;

  this.path = require.resolve('electron-chromedriver/chromedriver');
  this.urlBase = '/';
  this.statusUrl = `http://${host}:${port}${this.urlBase}status`;
  this.logLines = [];
}

ChromeDriver.prototype.start = function start() {
  if (this.process) throw new Error('ChromeDriver already started');

  const args = [
    this.path,
    `--port=${this.port}`,
    `--url-base=${this.urlBase}`,
    '--headless --no-sandbox --disable-dev-shm-usage',
  ];

  if (this.chromeDriverLogPath) {
    args.push('--verbose');
    args.push(`--log-path=${this.chromeDriverLogPath}`);
  }
  const options = {
    cwd: this.workingDirectory,
    env: this.getEnvironment(),
  };
  this.process = ChildProcess.spawn(this.nodePath, args, options);
  this.exitHandler = () => this.stop();
  global.process.on('exit', this.exitHandler);

  this.setupLogs();
  return this.waitUntilRunning();
};

ChromeDriver.prototype.waitUntilRunning = async function waitUntilRunning() {
  const self = this;
  const startTime = Date.now();

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function checkIfRunning() {
    const running = await self.isRunning();
    if (!self.process) {
      throw new Error('ChromeDriver has been stopped');
    }

    if (running) {
      return;
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > self.startTimeout) {
      throw new Error(`ChromeDriver did not start within ${self.startTimeout}ms`);
    }

    await delay(100);
    checkIfRunning();
  }
  return checkIfRunning();
};

ChromeDriver.prototype.setupLogs = function setupLogs() {
  this.logLines = [];

  const self = this;
  this.process.stdout.pipe(split()).on('data', (line) => {
    self.logLines.push(line);
  });
};

ChromeDriver.prototype.getEnvironment = function getEnvironment() {
  const env = {};
  Object.keys(process.env).forEach((key) => {
    env[key] = process.env[key];
  });

  if (process.platform === 'win32') {
    env.SPECTRON_NODE_PATH = process.execPath;
    env.SPECTRON_LAUNCHER_PATH = path.join(__dirname, 'launcher.js');
  }

  return env;
};

ChromeDriver.prototype.stop = function stop() {
  if (this.exitHandler) global.process.removeListener('exit', this.exitHandler);
  this.exitHandler = null;

  if (this.process) this.process.kill();
  this.process = null;

  this.clearLogs();
};

ChromeDriver.prototype.isRunning = async function isRunning() {
  try {
    const { value } = await got(this.statusUrl).json();
    return value && value.ready;
  } catch (error) {
    throw new Error(`ChromeDriver isRunning error: ${error.message}`);
  }
};

ChromeDriver.prototype.getLogs = function getLogs() {
  return this.logLines.slice();
};

ChromeDriver.prototype.clearLogs = function clearLogs() {
  this.logLines = [];
};

module.exports = ChromeDriver;
