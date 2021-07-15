# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![CI](https://github.com/goosewobbler/spectron/workflows/CI/badge.svg)](https://github.com/goosewobbler/spectron/actions)
[![dependencies](https://img.shields.io/david/goosewobbler/spectron.svg)](https://david-dm.org/goosewobbler/spectron) [![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT) [![npm:](https://img.shields.io/npm/v/spectron.svg)](https://www.npmjs.com/package/spectron) [![downloads](https://img.shields.io/npm/dm/spectron.svg)](https://www.npmjs.com/package/spectron)

Easily test your [Electron](http://electronjs.org) apps using
[ChromeDriver](https://sites.google.com/chromium.org/driver/) and
[WebdriverIO](http://webdriver.io).

## Differences between this fork and @electron-userland/spectron

This was forked to fulfil a simple requirement - bring Spectron in line with modern Electron development, by any means necessary. That means I deleted a lot of code and some things might not work as expected. Spectron really needs a complete rewrite, this is merely a collection of hacks - although I believe them to be less hacky than some of the "official" attempts at keeping Spectron working with modern Electron versions. Hopefully this code will inspire some future development. I might rewrite it completely at some point, or switch to [Playwright](https://playwright.dev) (currently experimental support for Electron).

This version of Spectron is designed to be used with `nodeIntegration: false`, `enableRemoteModule: false`, and `contextIsolation: true`. These are recommended defaults for modern secure Electron apps.

## Installation

```sh
npm install --save-dev spectron
```

## Usage

Spectron works with any testing framework but the following example uses
[mocha](https://mochajs.org):

To get up and running from your command line:

```sh
# Install mocha locally as a dev dependency.
npm i mocha -D

# From the project root, create a folder called test, in that directory, create a file called 'spec.js'
touch test/spec.js

# Change directory to test
cd test
```

Then simply include the following in your first `spec.js`.

```js
const Application = require('spectron').Application;
const assert = require('assert');
const electronPath = require('electron'); // Require Electron from the binaries included in node_modules.
const path = require('path');

describe('Application launch', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      // Your electron path can be any binary
      // i.e for OSX an example path could be '/Applications/MyApp.app/Contents/MacOS/MyApp'
      // But for the sake of the example we fetch it from our node_modules.
      path: electronPath,

      // Assuming you have the following directory structure

      //  |__ my project
      //     |__ ...
      //     |__ main.js
      //     |__ package.json
      //     |__ index.html
      //     |__ ...
      //     |__ test
      //        |__ spec.js  <- You are here! ~ Well you should be.

      // The following line tells spectron to look and use the main.js file
      // and the package.json located 1 level above.
      args: [path.join(__dirname, '..')],
    });
    return this.app.start();
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1);
      // Please note that getWindowCount() will return 2 if `dev tools` are opened.
      // assert.equal(count, 2)
    });
  });
});
```

Create an npm task in your package.json file

```sh
"scripts": {
  "test": "mocha"
}
```

And from the root of your project, in your command-line simply run:

```sh
npm test
```

By default, mocha searches for a folder with the name `test` ( which we created before ).
For more information on how to configure mocha, please visit [mocha](https://mochajs.org).

#### Limitations

As stated in [issue #19](https://github.com/electron/spectron/issues/19), Spectron will not be able to start if your Electron app is launched using the `remote-debugging-port` command-line switch (i.e. `app.commandLine.appendSwitch('remote-debugging-port', <debugging-port-number>);`). Please make sure to include the necessary logic in your app's code to disable the switch during tests.

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

### Node Integration

The Electron helpers provided by Spectron require accessing the core Electron
APIs in the renderer processes of your application. So, either your Electron
application has `nodeIntegration` set to `true` or you'll need to expose a
`require` window global to Spectron so it can access the core Electron APIs.

You can do this by adding a [`preload`][preload] script that does the following:

```js
if (process.env.NODE_ENV === 'test') {
  window.electronRequire = require;
}
```

Then create the Spectron `Application` with the `requireName` option set to
`'electronRequire'` and then runs your tests via `NODE_ENV=test npm test`.

**Note:** This is only required if your tests are accessing any Electron APIs.
You don't need to do this if you are only accessing the helpers on the `client`
property which do not require Node integration.

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

#### electron

The `electron` property is your gateway to accessing the full Electron API.

Each Electron module is exposed as a property on the `electron` property
so you can think of it as an alias for `require('electron')` from within your
app.

So if you wanted to access the [clipboard](http://electronjs.org/docs/latest/api/clipboard)
API in your tests you would do:

```js
app.electron.clipboard
  .writeText('pasta')
  .electron.clipboard.readText()
  .then(function (clipboardText) {
    console.log('The clipboard text is ' + clipboardText);
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

## Continuous Integration

### On Travis CI

You will want to add the following to your `.travis.yml` file when building on
Linux:

```yml
before_script:
  - 'export DISPLAY=:99.0'
  - 'sh -e /etc/init.d/xvfb start'
  - sleep 3 # give xvfb some time to start
```

Check out Spectron's [.travis.yml](https://github.com/electron/spectron/blob/master/.travis.yml)
file for a production example.

### On AppVeyor

You will want to add the following to your `appveyor.yml` file:

```yml
os: unstable
```

Check out Spectron's [appveyor.yml](https://github.com/electron/spectron/blob/master/appveyor.yml)
file for a production example.

## Test Library Examples

### With Chai As Promised

WebdriverIO is promise-based and so it pairs really well with the
[Chai as Promised](https://github.com/domenic/chai-as-promised) library that
builds on top of [Chai](http://chaijs.com).

Using these together allows you to chain assertions together and have fewer
callback blocks. See below for a simple example:

```sh
npm install --save-dev chai
npm install --save-dev chai-as-promised
```

```js
const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const electronPath = require('electron');
const path = require('path');

chai.should();
chai.use(chaiAsPromised);

describe('Application launch', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..')],
    });
    return this.app.start();
  });

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('opens a window', function () {
    return this.app.client
      .waitUntilWindowLoaded()
      .getWindowCount()
      .should.eventually.have.at.least(1)
      .browserWindow.isMinimized()
      .should.eventually.be.false.browserWindow.isVisible()
      .should.eventually.be.true.browserWindow.isFocused()
      .should.eventually.be.true.browserWindow.getBounds()
      .should.eventually.have.property('width')
      .and.be.above(0)
      .browserWindow.getBounds()
      .should.eventually.have.property('height')
      .and.be.above(0);
  });
});
```

### With AVA

Spectron works with [AVA](https://github.com/avajs/ava), which allows you
to write your tests in ES2015+ without doing any extra work.

```js
import test from 'ava';
import { Application } from 'spectron';

test.beforeEach((t) => {
  t.context.app = new Application({
    path: '/Applications/MyApp.app/Contents/MacOS/MyApp',
  });

  return t.context.app.start();
});

test.afterEach((t) => {
  return t.context.app.stop();
});

test((t) => {
  return t.context.app.client
    .waitUntilWindowLoaded()
    .getWindowCount()
    .then((count) => {
      t.is(count, 1);
    })
    .browserWindow.isMinimized()
    .then((min) => {
      t.false(min);
    })
    .browserWindow.isDevToolsOpened()
    .then((opened) => {
      t.false(opened);
    })
    .browserWindow.isVisible()
    .then((visible) => {
      t.true(visible);
    })
    .browserWindow.isFocused()
    .then((focused) => {
      t.true(focused);
    })
    .browserWindow.getBounds()
    .then((bounds) => {
      t.true(bounds.width > 0);
      t.true(bounds.height > 0);
    });
});
```

AVA has built-in support for [async functions](https://github.com/avajs/ava#async-function-support), which simplifies async operations:

```js
import test from 'ava';
import { Application } from 'spectron';

test.beforeEach(async (t) => {
  t.context.app = new Application({
    path: '/Applications/MyApp.app/Contents/MacOS/MyApp',
  });

  await t.context.app.start();
});

test.afterEach.always(async (t) => {
  await t.context.app.stop();
});

test(async (t) => {
  const app = t.context.app;
  await app.client.waitUntilWindowLoaded();

  const win = app.browserWindow;
  t.is(await app.client.getWindowCount(), 1);
  t.false(await win.isMinimized());
  t.false(await win.isDevToolsOpened());
  t.true(await win.isVisible());
  t.true(await win.isFocused());

  const { width, height } = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);
});
```

[preload]: http://electronjs.org/docs/api/browser-window/#new-browserwindowoptions
