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
    if (app) {
      app.stop().then(done, done)
    } else {
      done()
    }
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

  describe('isFocused()', function () {
    it('returns true when the current window is focused', function (done) {
      app.client.isFocused().then(function (focused) {
        assert.equal(focused, true)
      }).then(done, done)
    })
  })

  describe('isDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function (done) {
      app.client.isDevToolsOpened().then(function (devToolsOpened) {
        assert.equal(devToolsOpened, false)
      }).then(done, done)
    })
  })

  describe('isFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function (done) {
      app.client.isFullScreen().then(function (fullScreen) {
        assert.equal(fullScreen, false)
      }).then(done, done)
    })
  })
})
