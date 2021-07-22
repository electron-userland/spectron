# Spectron Configuration

## Options

You can create a new application with the following options:

- `path` - **Required.** String path to the Electron application executable to
  launch.
  **Note:** If you want to invoke `electron` directly with your app's main
  script then you should specify `path` as `electron` via `electron-prebuilt`
  and specify your app's main script path as the first argument in the `args`
  array.
- `args` - Array of arguments to pass to the Electron application.
- `chromeDriverArgs` - Array of arguments to pass to ChromeDriver.
  See [here](https://sites.google.com/a/chromium.org/chromedriver/capabilities) for details on the Chrome arguments.
- `cwd`- String path to the working directory to use for the launched
  application. Defaults to `process.cwd()`.
- `env` - Object of additional environment variables to set in the launched
  application.
- `host` - String host name of the launched `chromedriver` process.
  Defaults to `'localhost'`.
- `port` - Number port of the launched `chromedriver` process.
  Defaults to `9515`.
- `nodePath` - String path to a `node` executable to launch ChromeDriver with.
  Defaults to `process.execPath`.
- `connectionRetryCount` - Number of retry attempts to make when connecting
  to ChromeDriver. Defaults to `10` attempts.
- `connectionRetryTimeout` - Number in milliseconds to wait for connections
  to ChromeDriver to be made. Defaults to `30000` milliseconds.
- `quitTimeout` - Number in milliseconds to wait for application quitting.
  Defaults to `1000` milliseconds.
- `startTimeout` - Number in milliseconds to wait for ChromeDriver to start.
  Defaults to `5000` milliseconds.
- `waitTimeout` - Number in milliseconds to wait for calls like
  `waitUntilTextExists` and `waitUntilWindowLoaded` to complete.
  Defaults to `5000` milliseconds.
- `debuggerAddress` - String address of a Chrome debugger server to connect to.
- `chromeDriverLogPath` - String path to file to store ChromeDriver logs in.
  Setting this option enables `--verbose` logging when starting ChromeDriver.
- `webdriverLogPath` - String path to a directory where Webdriver will write
  logs to. Setting this option enables `verbose` logging from Webdriver.
- `webdriverOptions` - Object of additional options for Webdriver
