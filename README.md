# spectron

[![Linux Build Status](https://travis-ci.org/kevinsawicki/spectron.svg?branch=master)](https://travis-ci.org/kevinsawicki/spectron)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/ppjnpi0ikqlhg6qw/branch/master?svg=true)](https://ci.appveyor.com/project/kevinsawicki/spectron/branch/master)
<br>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![devDependencies:?](https://img.shields.io/david/kevinsawicki/spectron.svg)](https://david-dm.org/kevinsawicki/spectron)
<br>
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)
[![npm:](https://img.shields.io/npm/v/spectron.svg)](https://www.npmjs.com/packages/spectron)
[![dependencies:?](https://img.shields.io/npm/dm/spectron.svg)](https://www.npmjs.com/packages/spectron)

Easily test your [Electron](http://electron.atom.io) apps using
[ChromeDriver](https://code.google.com/p/selenium/wiki/ChromeDriver) and
[WebdriverIO](http://webdriver.io).

This minor version of this library tracks the minor version of the Electron
versions released. So if you are using Electron `0.37.x` you would want to use
a `spectron` dependency of `~1.37` in your `package.json` file.

Learn more from [this presentation](https://speakerdeck.com/kevinsawicki/testing-your-electron-apps-with-chromedriver).

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

### On Travis CI

You will want to add the following to your `.travis.yml` file when building on
Linux:

```yml
before_script:
  - "export DISPLAY=:99.0"
  - "sh -e /etc/init.d/xvfb start"
  - sleep 3 # give xvfb some time to start
```

Check out Spectron's [.travis.yml](https://github.com/kevinsawicki/spectron/blob/master/.travis.yml)
file for a production example.

### On AppVeyor

You will want to add the following to your `appveyor.yml` file:

```yml
os: unstable
```

Check out Spectron's [appveyor.yml](https://github.com/kevinsawicki/spectron/blob/master/appveyor.yml)
file for a production example.

## API

### Application

#### new Application(options)

Create a new application with the following options:

* `path` - String path to the application executable to launch. **Required**
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
* `startTimeout` - Number in milliseconds to wait for ChromeDriver to start.
  Defaults to `5000` milliseconds.
* `waitTimeout` - Number in milliseconds to wait for calls like
  `waitUntilTextExists` and `waitUntilWindowLoaded` to complete.
  Defaults to `5000` milliseconds.


#### start()

Starts the application. Returns a `Promise` that will be resolved when the
application is ready to use. You should always wait for start to complete
before running any commands.

#### stop()

Stops the application. Returns a `Promise` that will be resolved once the
application has stopped.

### Client Commands

Spectron uses [WebdriverIO](http://webdriver.io) and exposes the managed
`client` property on the created `Application` instances.

The full `client` API provided by WebdriverIO can be found
[here](http://webdriver.io/api.html).

Several additional commands are provided specific to Electron.

All the commands return a `Promise`.

#### getMainProcessLogs()

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

#### getRenderProcessLogs()

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

#### getSelectedText()

Get the selected text in the current window.

```js
app.client.getSelectedText().then(function (selectedText) {
  console.log(selectedText)
})
```

#### getWindowCount()

Gets the number of open windows.

```js
app.client.getWindowCount().then(function (count) {
  console.log(count)
})
```

#### waitUntilTextExists(selector, text, [timeout])

Waits until the element matching the given selector contains the given
text. Takes an optional timeout in milliseconds that defaults to `5000`.

```js
app.client.waitUntilTextExists('#message', 'Success', 10000)
```

#### waitUntilWindowLoaded([timeout])

Wait until the window is no longer loading. Takes an optional timeout
in milliseconds that defaults to `5000`.

```js
app.client.waitUntilWindowLoaded(10000)
```

#### windowByIndex(index)

Focus a window using its index from the `windowHandles()` array.

```js
app.client.windowByIndex(1)
```

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
    chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
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

Spectron works with [AVA](https://github.com/sindresorhus/ava) which allows you
to write your tests in ES2015 without extra support.

```js
'use strict';

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
      t.ok(bounds.width > 0);
      t.ok(bounds.height > 0);
    });
});
```

AVA supports ECMAScript advanced features not only promise but also async/await.

```js
test(async t => {
  await t.context.app.client.waitUntilWindowLoaded();
  t.is(1, await app.client.getWindowCount());
  t.false(await app.browserWindow.isMinimized());
  t.false(await app.browserWindow.isDevToolsOpened());
  t.true(await app.browserWindow.isVisible());
  t.true(await app.browserWindow.isFocused());
  t.ok((await app.browserWindow.getBounds()).width > 0);
  t.ok((await app.browserWindow.getBounds()).height > 0);
});
```
