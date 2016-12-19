# <img src="https://cloud.githubusercontent.com/assets/378023/15063284/cf544f2c-1383-11e6-9336-e13bd64b1694.png" width="60px" align="center" alt="Spectron icon"> Spectron

[![Linux Build Status](https://travis-ci.org/electron/spectron.svg?branch=master)](https://travis-ci.org/electron/spectron)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/iv8xd919q6b44pap/branch/master?svg=true)](https://ci.appveyor.com/project/kevinsawicki/spectron/branch/master)
<br>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![devDependencies:?](https://img.shields.io/david/electron/spectron.svg)](https://david-dm.org/electron/spectron)
<br>
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)
[![npm:](https://img.shields.io/npm/v/spectron.svg)](https://www.npmjs.com/packages/spectron)
[![dependencies:?](https://img.shields.io/npm/dm/spectron.svg)](https://www.npmjs.com/packages/spectron)

Easily test your [Electron](http://electron.atom.io) apps using
[ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver) and
[WebdriverIO](http://webdriver.io).

This minor version of this library tracks the minor version of the Electron
versions released. So if you are using Electron `1.0.x` you would want to use
a `spectron` dependency of `~3.0.0` in your `package.json` file.

Learn more from [this presentation](https://speakerdeck.com/kevinsawicki/testing-your-electron-apps-with-chromedriver).

:rotating_light: Upgrading from `1.x` to `2.x`/`3.x`? Read the [changelog](https://github.com/electron/spectron/blob/master/CHANGELOG.md).

## Using

```sh
npm install --save-dev spectron
```

Spectron works with any testing framework but the following example uses
[mocha](https://mochajs.org):

```js
var Application = require('spectron').Application
var assert = require('assert')

describe('application launch', function () {
  this.timeout(10000)

  beforeEach(function () {
    this.app = new Application({
      path: '/Applications/MyApp.app/Contents/MacOS/MyApp'
    })
    return this.app.start()
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1)
    })
  })
})
```

## Application API

Spectron exports an `Application` class that when configured, can start and
stop your Electron application.

### new Application(options)

Create a new application with the following options:

* `path` -  **Required.** String path to the Electron application executable to
  launch.
  **Note:** If you want to invoke `electron` directly with your app's main
  script then you should specify `path` as  `electron` via `electron-prebuilt`
  and specify your app's main script path as the first argument in the `args`
  array.
* `args` - Array of arguments to pass to the executable.
  See [here](https://sites.google.com/a/chromium.org/chromedriver/capabilities)
  for details on the Chrome arguments.
* `cwd`- String path to the working directory to use for the launched
  application. Defaults to `process.cwd()`.
* `env` - Object of additional environment variables to set in the launched
  application.
* `host` - String host name of the launched `chromedriver` process.
  Defaults to `'localhost'`.
* `port` - Number port of the launched `chromedriver` process.
  Defaults to `9515`.
* `nodePath` - String path to a `node` executable to launch ChromeDriver with.
  Defaults to `process.execPath`.
* `connectionRetryCount` - Number of retry attempts to make when connecting
  to ChromeDriver. Defaults to `10` attempts.
* `connectionRetryTimeout` - Number in milliseconds to wait for connections
  to ChromeDriver to be made. Defaults to `30000` milliseconds.
* `quitTimeout` - Number in milliseconds to wait for application quitting.
  Defaults to `1000` milliseconds.
* `requireName` - Custom property name to use when requiring modules. Defaults
  to `require`. This should only be used if your application deletes the main
  `window.require` function and assigns it to another property name on `window`.
* `startTimeout` - Number in milliseconds to wait for ChromeDriver to start.
  Defaults to `5000` milliseconds.
* `waitTimeout` - Number in milliseconds to wait for calls like
  `waitUntilTextExists` and `waitUntilWindowLoaded` to complete.
  Defaults to `5000` milliseconds.
* `debuggerAddress` - String address of a Chrome debugger server to connect to.
* `chromeDriverLogPath` - String path to file to store ChromeDriver logs in.
  Setting this option enables `--verbose` logging when starting ChromeDriver.

### Node Integration

The Electron helpers provided by Spectron require accessing the core Electron
APIs in the renderer processes of your application. So if your Electron
application has `nodeIntegration` set to `false` then you'll need to expose a
`require` window global to Spectron so it can access the core Electron APIs.

You can do this by adding a [`preload`][preload] script that does the following:

```js
if (process.env.NODE_ENV === 'test') {
  window.electronRequire = require
}
```

Then create the Spectron `Application` with the `requireName` option set to
`'electronRequire'` and then runs your tests via `NODE_ENV=test npm test`.

**Note:** This is only required if you tests are accessing any Electron APIs.
You don't need to do this if you are only accessing the helpers on the `client`
property which do not require Node integration.

### Properties

#### client

Spectron uses [WebdriverIO](http://webdriver.io) and exposes the managed
`client` property on the created `Application` instances.

The full `client` API provided by WebdriverIO can be found
[here](http://webdriver.io/api.html).

Several additional commands are provided specific to Electron.

All the commands return a `Promise`.

So if you wanted to get the text of an element you would do:

```js
app.client.getText('#error-alert').then(function (errorText) {
  console.log('The #error-alert text content is ' + errorText)
})
```

#### electron

The `electron` property is your gateway to accessing the full Electron API.

Each Electron module is exposed as a property on the `electron` property
so you can think of it as an alias for `require('electron')` from within your
app.

So if you wanted to access the [clipboard](http://electron.atom.io/docs/latest/api/clipboard)
API in your tests you would do:

```js
app.electron.clipboard.writeText('pasta')
   .electron.clipboard.readText().then(function (clipboardText) {
     console.log('The clipboard text is ' + clipboardText)
   })
```

#### browserWindow

The `browserWindow` property is an alias for `require('electron').remote.getCurrentWindow()`.

It provides you access to the current [BrowserWindow](http://electron.atom.io/docs/latest/api/browser-window/)
and contains all the APIs.

So if you wanted to check if the current window is visible in your tests you
would do:

```js
app.browserWindow.isVisible().then(function (visible) {
  console.log('window is visible? ' + visible)
})
```

It is named `browserWindow` instead of `window` so that it doesn't collide
with the WebDriver command of that name.

##### capturePage

The async `capturePage` API is supported but instead of taking a callback it
returns a `Promise` that resolves to a `Buffer` that is the image data of
screenshot.

```js
app.browserWindow.capturePage().then(function (imageBuffer) {
  fs.writeFile('page.png', imageBuffer)
})
```

#### webContents

The `webContents` property is an alias for `require('electron').remote.getCurrentWebContents()`.

It provides you access to the [WebContents](http://electron.atom.io/docs/latest/api/web-contents/)
for the current window and contains all the APIs.

So if you wanted to check if the current window is loading in your tests you
would do:

```js
app.webContents.isLoading().then(function (visible) {
  console.log('window is loading? ' + visible)
})
```

##### savePage

The async `savePage` API is supported but instead of taking a callback it
returns a `Promise` that will raise any errors and resolve to `undefined` when
complete.

```js
app.webContents.savePage('/Users/kevin/page.html', 'HTMLComplete')
  .then(function () {
    console.log('page saved')
  }).catch(function (error) {
    console.error('saving page failed', error.message)
  })
```

#### mainProcess

The `mainProcess` property is an alias for `require('electron').remote.process`.

It provides you access to the main process's [process](https://nodejs.org/api/process.html)
global.

So if you wanted to get the `argv` for the main process in your tests you would
do:

```js
app.mainProcess.argv().then(function (argv) {
  console.log('main process args: ' + argv)
})
```

Properties on the `process` are exposed as functions that return promises so
make sure to call `mainProcess.env().then(...)` instead of
`mainProcess.env.then(...)`.

#### rendererProcess

The `rendererProcess` property is an alias for `global.process`.

It provides you access to the renderer process's [process](https://nodejs.org/api/process.html)
global.

So if you wanted to get the environment variables for the renderer process in
your tests you would do:

```js
app.rendererProcess.env().then(function (env) {
  console.log('renderer process env variables: ' + env)
})
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
    console.log(log)
  })
})
```

#### client.getRenderProcessLogs()

Gets the `console` log output from the render process. The logs are cleared
after they are returned.

Returns a `Promise` that resolves to an array of log objects.

```js
app.client.getRenderProcessLogs().then(function (logs) {
  logs.forEach(function (log) {
    console.log(log.message)
    console.log(log.source)
    console.log(log.level)
  })
})
```

#### client.getSelectedText()

Get the selected text in the current window.

```js
app.client.getSelectedText().then(function (selectedText) {
  console.log(selectedText)
})
```

#### client.getWindowCount()

Gets the number of open windows.
`<webview>` tags are also counted as separate windows.

```js
app.client.getWindowCount().then(function (count) {
  console.log(count)
})
```

#### client.waitUntilTextExists(selector, text, [timeout])

Waits until the element matching the given selector contains the given
text. Takes an optional timeout in milliseconds that defaults to `5000`.

```js
app.client.waitUntilTextExists('#message', 'Success', 10000)
```

#### client.waitUntilWindowLoaded([timeout])

Wait until the window is no longer loading. Takes an optional timeout
in milliseconds that defaults to `5000`.

```js
app.client.waitUntilWindowLoaded(10000)
```

#### client.windowByIndex(index)

Focus a window using its index from the `windowHandles()` array.
`<webview>` tags can also be focused as a separate window.

```js
app.client.windowByIndex(1)
```

### Accessibility Testing

Spectron bundles the [Accessibility Developer Tools](https://github.com/GoogleChrome/accessibility-developer-tools)
provided by Google and adds support for auditing each window and `<webview>`
tag in your application.

#### client.auditAccessibility(options)

Run an accessibility audit in the focused window with the specified options.

* `options` - An optional Object with the following keys:
  * `ignoreWarnings` - `true` to ignore failures with a severity of `'Warning'`
    and only include failures with a severity of `'Severe'`. Defaults to `false`.
  * `ignoreRules` - Array of String rule code values such as `AX_COLOR_01` to
    ignore failures for. The full list is available [here](https://github.com/GoogleChrome/accessibility-developer-tools/wiki/Audit-Rules).

Returns an `audit` Object with the following properties:

* `message` - A detailed String message about the results
* `failed` - A Boolean, `false` when the audit has failures
* `results` - An array of detail objects for each failed rule. Each object
  in the array has the following properties:
  * `code` - A unique String accessibility rule identifier
  * `elements` - An Array of Strings representing the selector path of each
    HTML element that failed the rule
  * `message` - A String message about the failed rule
  * `severity` - `'Warning'` or `'Severe'`
  * `url` - A String URL providing more details about the failed rule

```js
app.client.auditAccessibility().then(function (audit) {
  if (audit.failed) {
    console.error(audit.message)
  }
})
```

See https://github.com/GoogleChrome/accessibility-developer-tools/wiki/Audit-Rules
for more details about the audit rules.

If you are using a `<webview>` tag in your app and want to audit both the outer
page and the `<webview>`'s page then you will need to do the following:

```js
// Focus main page and audit it
app.client.windowByIndex(0).then(function() {
  app.client.auditAccessibility().then(function (audit) {
    if (audit.failed) {
      console.error('Main page failed audit')
      console.error(audit.message)
    }

    //Focus <webview> tag and audit it
    app.client.windowByIndex(1).then(function() {
      app.client.auditAccessibility().then(function (audit) {
        if (audit.failed) {
          console.error('<webview> page failed audit')
          console.error(audit.message)
        }
      })
    })
  })
})
```

## Continuous Integration

### On Travis CI

You will want to add the following to your `.travis.yml` file when building on
Linux:

```yml
before_script:
  - "export DISPLAY=:99.0"
  - "sh -e /etc/init.d/xvfb start"
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
var Application = require('spectron').Application
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var path = require('path')

chai.should()
chai.use(chaiAsPromised)

describe('application launch', function () {
  beforeEach(function () {
    this.app = new Application({
      path: '/Applications/MyApp.app/Contents/MacOS/MyApp'
    })
    return this.app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })
})
```

### With AVA

Spectron works with [AVA](https://github.com/avajs/ava), which allows you
to write your tests in ES2015+ without doing any extra work.

```js
import test from 'ava';
import {Application} from 'spectron';

test.beforeEach(t => {
  t.context.app = new Application({
    path: '/Applications/MyApp.app/Contents/MacOS/MyApp'
  });

  return t.context.app.start();
});

test.afterEach(t => {
  return t.context.app.stop();
});

test(t => {
  return t.context.app.client.waitUntilWindowLoaded()
    .getWindowCount().then(count => {
      t.is(count, 1);
    }).browserWindow.isMinimized().then(min => {
      t.false(min);
    }).browserWindow.isDevToolsOpened().then(opened => {
      t.false(opened);
    }).browserWindow.isVisible().then(visible => {
      t.true(visible);
    }).browserWindow.isFocused().then(focused => {
      t.true(focused);
    }).browserWindow.getBounds().then(bounds => {
      t.true(bounds.width > 0);
      t.true(bounds.height > 0);
    });
});
```

AVA has built-in support for [async functions](https://github.com/avajs/ava#async-function-support), which simplifies async operations:

```js
import test from 'ava';
import {Application} from 'spectron';

test.beforeEach(async t => {
  t.context.app = new Application({
    path: '/Applications/MyApp.app/Contents/MacOS/MyApp'
  });

  await t.context.app.start();
});

test.afterEach.always(async t => {
  await t.context.app.stop();
});

test(async t => {
  const app = t.context.app;
  await app.client.waitUntilWindowLoaded();

  const win = app.browserWindow;
  t.is(await app.client.getWindowCount(), 1);
  t.false(await win.isMinimized());
  t.false(await win.isDevToolsOpened());
  t.true(await win.isVisible());
  t.true(await win.isFocused());

  const {width, height} = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);
});
```

[preload]: http://electron.atom.io/docs/api/browser-window/#new-browserwindowoptions
