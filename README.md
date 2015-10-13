# spectron

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/kevinsawicki/spectron.svg?branch=master)](https://travis-ci.org/kevinsawicki/spectron)

Easily test your [Electron](http://electron.atom.io) apps using [ChromeDriver](https://code.google.com/p/selenium/wiki/ChromeDriver)
and [webdriverio](http://webdriver.io).

## Using

```sh
npm --save-dev spectron
```

Spectron works with any testing framework but the following example uses
[mocha](https://mochajs.org).

```js
var Application = require('spectron').Application
var assert = require('assert')

describe('application loading', function () {
  this.timeout(10000)

  var app = null

  beforeEach(function (done) {
    app = new Application({
      path: '/Applications/MyApp.app/Contents/MacOS/MyApp'
    })
    app.start().then(done, done)
  })

  afterEach(function (done) {
    app.stop().then(done, done)
    app = null
  })

  it('launches the application and shows an initial window', function (done) {
    app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 1)
    }).then(done, done)
  })
})
```

### Application

#### new Application(options)

Create a new application with the following options:

* `path` - String path to the application executable to launch. **Required**
* `args` - Chrome arguments to pass to the executable.
  See [here](https://sites.google.com/a/chromium.org/chromedriver/capabilities) for more details.
* `host` - String host name of the launched `chromedriver` process.
  Defaults to `'localhost'`.
* `port` - Number port of the launched `chromedriver` process.
  Defaults to `9515`.
* `quitTimeout` - Number in milliseconds to wait for application quitting.
  Defaults to `1000` milliseconds.

#### start()

Starts the application. Returns a `Promise` that will be resolved when the
application is ready to use. You should always wait for start to complete
before running any commands.

#### stop()

Stops the application. Returns a `Promise` that will be resolved once the
application has stopped.

### Client Commands

Spectron uses [webdriverio](http://webdriver.io) and exposes the managed
`client` property on the created `Application` instances.

The full `client` API provided by `webdriverio` can be found [here](http://webdriver.io/api.html).

Several additional commands are provided specific to Electron.

#### getWindowDimensions()

Gets the window dimensions of the current window. Object returned has
`x`, `y`, `width`, and `height` properties.

```js
app.client.getWindowDimensions().then(function (dimensions) {
  assert.equal(dimensions.x, 25)
  assert.equal(dimensions.y, 35)
  assert.equal(dimensions.width, 200)
  assert.equal(dimensions.height, 100)
}).then(done, done)
```

#### setWindowDimensions(x, y, width, height)

Sets the window position and size.

```js
app.client.setWindowDimensions(100, 200, 50, 75).then(done, done)
```
