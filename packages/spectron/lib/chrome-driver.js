const ChildProcess = require('child_process');
const { join } = require('path');
const {
  default: { get },
} = require('got');
const split = require('split');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createProcessArgs(path, port, chromeDriverLogPath) {
  const args = [path, `--port=${port}`, '--url-base=/'];
  if (chromeDriverLogPath) {
    args.push('--verbose');
    args.push(`--log-path=${chromeDriverLogPath}`);
  }
  return args;
}

function createProcessOptions(workingDirectory) {
  const env = {};
  Object.keys(process.env).forEach((key) => {
    env[key] = process.env[key];
  });

  if (process.platform === 'win32') {
    env.SPECTRON_NODE_PATH = process.execPath;
    env.SPECTRON_LAUNCHER_PATH = join(__dirname, 'launcher.js');
  }

  return {
    cwd: workingDirectory,
    env,
  };
}

function initChromeDriver(host, port, nodePath, startTimeout, workingDirectory, chromeDriverLogPath) {
  const path = require.resolve('electron-chromedriver/chromedriver');
  const statusUrl = `http://${host}:${port}/status`;

  const chromeDriver = (() => {
    let exitHandler;
    let logLines;
    let chromeDriverProcess;

    const clearLogs = () => {
      logLines = [];
    };

    const getLogs = () => logLines;

    const isRunning = async () => {
      try {
        console.log('checking', statusUrl);
        const { value } = await get(statusUrl).json();
        return value && value.ready;
      } catch (error) {
        return false;
        // throw new Error(`ChromeDriver isRunning error: ${error.message}`);
      }
    };

    const waitUntilRunning = async () => {
      const startTime = Date.now();

      async function checkIfRunning() {
        const running = await isRunning();
        if (!chromeDriverProcess) {
          throw new Error('ChromeDriver has been stopped');
        }

        if (running) {
          return true;
        }

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > startTimeout) {
          throw new Error(`ChromeDriver did not start within ${startTimeout}ms`);
        }

        await delay(100);
        return checkIfRunning();
      }

      return checkIfRunning();
    };

    const stop = () => {
      if (exitHandler) {
        global.process.removeListener('exit', exitHandler);
        exitHandler = null;
      }

      if (chromeDriverProcess) {
        chromeDriverProcess.kill();
        chromeDriverProcess = null;
      }

      clearLogs();
    };

    async function start() {
      if (chromeDriverProcess) {
        throw new Error('ChromeDriver already started');
      }

      const args = createProcessArgs(path, port, chromeDriverLogPath);
      const options = createProcessOptions(workingDirectory);

      chromeDriverProcess = ChildProcess.spawn(nodePath, args, options);
      exitHandler = () => stop();
      global.process.on('exit', exitHandler);
      logLines = [];

      if (chromeDriverProcess.stdout) {
        chromeDriverProcess.stdout.pipe(split()).on('data', (line) => logLines.push(line));
      }

      return waitUntilRunning();
    }

    return {
      start,
      stop,
      getLogs,
      clearLogs,
    };
  })();

  return chromeDriver;
}

module.exports = {
  initChromeDriver,
};
