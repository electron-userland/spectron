var Application = require('../index').Application
var assert = require('assert')
var path = require('path')

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('window commands', function () {
  this.timeout(10000)

  var app = null

  before(function () {
    app = new Application({
      path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      args: [
        path.join(__dirname, 'fixtures', 'app')
      ]
    })
    return app.start()
  })

  after(function () {
    return app.stop()
  })

  describe('setWindowDimensions', function () {
    it('sets the window dimensions', function () {
      return app.client.setWindowDimensions(100, 200, 50, 75).getWindowDimensions().then(function (dimensions) {
        assert.equal(dimensions.x, 100)
        assert.equal(dimensions.y, 200)
        assert.equal(dimensions.width, 50)
        assert.equal(dimensions.height, 75)
      })
    })
  })

  describe('isWindowFocused()', function () {
    it('returns true when the current window is focused', function () {
      return app.client.isWindowFocused().then(function (focused) {
        assert.equal(focused, true)
      })
    })
  })

  describe('isWindowVisible()', function () {
    it('returns true when the window is visible, false otherwise', function () {
      return app.client.hideWindow().isWindowVisible().then(function (visible) {
        assert.equal(visible, false)
      }).showWindow().isWindowVisible().then(function (visible) {
        assert.equal(visible, true)
      })
    })
  })

  describe('isWindowDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function () {
      return app.client.isWindowDevToolsOpened().then(function (devToolsOpened) {
        assert.equal(devToolsOpened, false)
      })
    })
  })

  describe('isWindowFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function () {
      return app.client.isWindowFullScreen().then(function (fullScreen) {
        assert.equal(fullScreen, false)
      })
    })
  })

  describe('waitUntilWindowLoaded()', function () {
    it('waits until the current window is loaded', function () {
      return app.client.waitUntilWindowLoaded().isWindowLoading().then(function (loading) {
        assert.equal(loading, false)
      })
    })
  })

  describe('isWindowMaximized()', function () {
    it('returns true when the window is maximized, false otherwise', function () {
      return app.client.isWindowMaximized().then(function (maximized) {
        assert.equal(maximized, false)
      }).maximizeWindow().waitUntil(function () {
        // FIXME window maximized state is never true on CI
        if (process.env.CI) return Promise.resolve(true)

        return this.isWindowMaximized()
      }, 5000).then(function () { })
    })
  })

  describe('isWindowMinimized()', function () {
    it('returns true when the window is minimized, false otherwise', function () {
      return app.client.isWindowMinimized().then(function (minimized) {
        assert.equal(minimized, false)
      }).minimizeWindow().waitUntil(function () {
        // FIXME window minimized state is never true on CI
        if (process.env.CI) return Promise.resolve(true)

        return this.isWindowMinimized()
      }, 5000).then(function () { })
    })
  })
})
