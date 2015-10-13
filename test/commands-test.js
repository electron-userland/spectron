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

  before(function (done) {
    app = new Application({
      path: path.join(__dirname, 'fixtures', 'app', 'app.js')
    })
    app.start().then(done, done)
  })

  after(function (done) {
    app.stop().then(done, done)
    app = null
  })

  describe('setWindowDimensions', function () {
    it('sets the window dimensions', function (done) {
      app.client.setWindowDimensions(100, 200, 50, 75).getWindowDimensions().then(function (dimensions) {
        assert.equal(dimensions.x, 100)
        assert.equal(dimensions.y, 200)
        assert.equal(dimensions.width, 50)
        assert.equal(dimensions.height, 75)
      }).then(done, done)
    })
  })

  describe('isWindowFocused()', function () {
    it('returns true when the current window is focused', function (done) {
      app.client.isWindowFocused().then(function (focused) {
        assert.equal(focused, true)
      }).then(done, done)
    })
  })

  describe('isWindowVisible()', function () {
    it('returns true when the window is visible, false otherwise', function (done) {
      app.client.hideWindow().isWindowVisible().then(function (visible) {
        assert.equal(visible, false)
      }).showWindow().isWindowVisible().then(function (visible) {
        assert.equal(visible, true)
      }).then(done, done)
    })
  })

  describe('isWindowDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function (done) {
      app.client.isWindowDevToolsOpened().then(function (devToolsOpened) {
        assert.equal(devToolsOpened, false)
      }).then(done, done)
    })
  })

  describe('isWindowFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function (done) {
      app.client.isWindowFullScreen().then(function (fullScreen) {
        assert.equal(fullScreen, false)
      }).then(done, done)
    })
  })

  describe('waitUntilWindowLoaded()', function () {
    it('waits until the current window is loaded', function (done) {
      app.client.waitUntilWindowLoaded().isWindowLoading().then(function (loading) {
        assert.equal(loading, false)
      }).then(done, done)
    })
  })

  describe('isWindowMaximized()', function () {
    it('returns true when the window is maximized, false otherwise', function (done) {
      app.client.isWindowMaximized().then(function (maximized) {
        assert.equal(maximized, false)
      }).maximizeWindow().waitUntil(function () {
        return this.isWindowMaximized()
      }, 5000).then(function () { }).then(done, done)
    })
  })

  describe('isWindowMinimized()', function () {
    it('returns true when the window is minimized, false otherwise', function (done) {
      app.client.isWindowMinimized().then(function (minimized) {
        assert.equal(minimized, false)
      }).minimizeWindow().waitUntil(function () {
        return this.isWindowMinimized()
      }, 5000).then(function () { }).then(done, done)
    })
  })
})
