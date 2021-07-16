# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![CI](https://github.com/goosewobbler/spectron/workflows/CI/badge.svg)](https://github.com/goosewobbler/spectron/actions)
[![dependencies](https://img.shields.io/david/goosewobbler/spectron.svg)](https://david-dm.org/goosewobbler/spectron) [![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT) [![npm:](https://img.shields.io/npm/v/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron) [![downloads](https://img.shields.io/npm/dm/@goosewobbler/spectron.svg)](https://www.npmjs.com/package/@goosewobbler/spectron)

Easily test your [Electron](http://electronjs.org) apps using
[ChromeDriver](https://sites.google.com/chromium.org/driver/) and
[WebdriverIO](http://webdriver.io).

## Differences between this fork and @electron-userland/spectron

This was forked to fulfil a simple requirement - bring Spectron in line with modern Electron development, by any means necessary. That means I deleted a lot of code and some things might not work as expected. Spectron really needs a complete rewrite, this is merely a collection of hacks - although I believe them to be less hacky than some of the "official" attempts at keeping Spectron working with modern Electron versions. Hopefully this code will inspire some future development. I might rewrite it completely at some point, or switch to [Playwright](https://playwright.dev) (currently experimental support for Electron).

This version of Spectron is designed to be used with `nodeIntegration: false`, `enableRemoteModule: false`, and `contextIsolation: true`. These are recommended defaults for modern secure Electron apps.

## Installation & Quick Start

```sh
npm install --save-dev @goosewobbler/spectron
```

In your main process root (index) file, add the following import:

```
import '@goosewobbler/spectron/main';
```

In your preload file, add the following import:

```
import '@goosewobbler/spectron/preload';
```

Add a spec file - the following is an example using Jest and Testing Library, on a Mac:

```
import path from 'path';
import { Application } from '@goosewobbler/spectron';
import { setupBrowser } from '@testing-library/webdriverio';

const app: Application = new Application({
  path: path.join(
    process.cwd(), // This works assuming you run npm test from project root
    // The path to the binary depends on your platform and architecture
    'dist/mac/lists.app/Contents/MacOS/lists',
  ),
});

describe('App', () => {
  beforeEach(async () => {
    await app.start();
    await app.client.waitUntilWindowLoaded();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  it('should launch app', async () => {
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
  });

  it('should display a new list button', async () => {
    const { getByRole } = setupBrowser(app.client);
    const button = await getByRole('button', { name: /New List/i });
    await button.click();
  });
});

```

Obviously this depends on your app binary so you will need to ensure it is built before the tests are executed.

## Known Limitations / WIP

In rough priority order:

- Doesn't seem to close down cleanly
- TypeScript `main` import type def needs doing
- Passing args and cwd through was removed, probably should find a way to put it back
- Multi-window test fails on CI
- Breaks with new WebDriverIO (v7)
- Could do with unit tests, better build process and...rewriting completely in TS.

## Application API

Spectron exports an `Application` class that when configured, can start and
stop your Electron application.

### new Application(options)

Create a new application with the following options:

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

### Properties

#### client

Spectron uses [WebdriverIO](http://webdriver.io) and exposes the managed
`client` property on the created `Application` instances.

The `client` API is WebdriverIO's `browser` object. Documentation can be found
[here](http://webdriver.io/api.html).

Several additional commands are provided specific to Electron.

All the commands return a `Promise`.

So if you wanted to get the text of an element you would do:

```js
app.client.getText('#error-alert').then(function (errorText) {
  console.log('The #error-alert text content is ' + errorText);
});
```

#### browserWindow

The `browserWindow` property is an alias for `require('electron').remote.getCurrentWindow()`.

It provides you access to the current [BrowserWindow](http://electronjs.org/docs/latest/api/browser-window/)
and contains all the APIs.

So if you wanted to check if the current window is visible in your tests you
would do:

```js
app.browserWindow.isVisible().then(function (visible) {
  console.log('window is visible? ' + visible);
});
```

It is named `browserWindow` instead of `window` so that it doesn't collide
with the WebDriver command of that name.

##### capturePage

The async `capturePage` API is supported but instead of taking a callback it
returns a `Promise` that resolves to a `Buffer` that is the image data of
screenshot.

```js
app.browserWindow.capturePage().then(function (imageBuffer) {
  fs.writeFile('page.png', imageBuffer);
});
```

#### webContents

The `webContents` property is an alias for `require('electron').remote.getCurrentWebContents()`.

It provides you access to the [WebContents](http://electronjs.org/docs/latest/api/web-contents/)
for the current window and contains all the APIs.

So if you wanted to check if the current window is loading in your tests you
would do:

```js
app.webContents.isLoading().then(function (visible) {
  console.log('window is loading? ' + visible);
});
```

##### savePage

The async `savePage` API is supported but instead of taking a callback it
returns a `Promise` that will raise any errors and resolve to `undefined` when
complete.

```js
app.webContents
  .savePage('/Users/kevin/page.html', 'HTMLComplete')
  .then(function () {
    console.log('page saved');
  })
  .catch(function (error) {
    console.error('saving page failed', error.message);
  });
```

##### executeJavaScript

The async `executeJavaScript` API is supported but instead of taking a callback it
returns a `Promise` that will resolve with the result of the last statement of the
script.

```js
app.webContents.executeJavaScript('1 + 2').then(function (result) {
  console.log(result); // prints 3
});
```

### Methods

#### start()

Starts the application. Returns a `Promise` that will be resolved when the
application is ready to use. You should always wait for start to complete
before running any commands.

#### stop()

Stops the application. Returns a `Promise` that will be resolved once the
application has stopped.

#### restart()

Stops the application and then starts it. Returns a `Promise` that will be
resolved once the application has started again.

#### isRunning()

Checks to determine if the application is running or not.

Returns a `Boolean`.

#### getSettings()

Get all the configured options passed to the `new Application()` constructor.
This will include the default options values currently being used.

Returns an `Object`.

#### client.getMainProcessLogs()

Gets the `console` log output from the main process. The logs are cleared
after they are returned.

Returns a `Promise` that resolves to an array of string log messages

```js
app.client.getMainProcessLogs().then(function (logs) {
  logs.forEach(function (log) {
    console.log(log);
  });
});
```

#### client.getRenderProcessLogs()

Gets the `console` log output from the render process. The logs are cleared
after they are returned.

Returns a `Promise` that resolves to an array of log objects.

```js
app.client.getRenderProcessLogs().then(function (logs) {
  logs.forEach(function (log) {
    console.log(log.message);
    console.log(log.source);
    console.log(log.level);
  });
});
```

#### client.getSelectedText()

Get the selected text in the current window.

```js
app.client.getSelectedText().then(function (selectedText) {
  console.log(selectedText);
});
```

#### client.getWindowCount()

Gets the number of open windows.
`<webview>` tags are also counted as separate windows.

```js
app.client.getWindowCount().then(function (count) {
  console.log(count);
});
```

#### client.waitUntilTextExists(selector, text, [timeout])

Waits until the element matching the given selector contains the given
text. Takes an optional timeout in milliseconds that defaults to `5000`.

```js
app.client.waitUntilTextExists('#message', 'Success', 10000);
```

#### client.waitUntilWindowLoaded([timeout])

Wait until the window is no longer loading. Takes an optional timeout
in milliseconds that defaults to `5000`.

```js
app.client.waitUntilWindowLoaded(10000);
```

#### client.windowByIndex(index)

Focus a window using its index from the `windowHandles()` array.
`<webview>` tags can also be focused as a separate window.

```js
app.client.windowByIndex(1);
```

#### client.switchWindow(urlOrTitleToMatch)

Focus a window using its URL or title.

```js
// switch via url match
app.client.switchWindow('google.com');

// switch via title match
app.client.switchWindow('Next-gen WebDriver test framework');
```
