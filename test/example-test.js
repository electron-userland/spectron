// Test for examples included in README.md
var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('example application launch', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'example')]
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('opens a window', function () {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
      .isWindowMinimized().should.eventually.be.false
      .isWindowVisible().should.eventually.be.true
      .isWindowFocused().should.eventually.be.true
      .getWindowWidth().should.eventually.be.above(0)
      .getWindowHeight().should.eventually.be.above(0)
  })

  describe('when the make larger button is clicked', function () {
    it('increases the window height and width by 10 pixels', function () {
      return app.client.waitUntilWindowLoaded()
        .getWindowHeight().should.eventually.equal(400)
        .getWindowWidth().should.eventually.equal(800)
        .click('.btn-make-bigger')
        .pause(1000)
        .getWindowHeight().should.eventually.equal(410)
        .getWindowWidth().should.eventually.equal(810)
    })
  })

  describe('when the make smaller button is clicked', function () {
    it('decreases the window height and width by 10 pixels', function () {
      return app.client.waitUntilWindowLoaded()
        .getWindowHeight().should.eventually.equal(400)
        .getWindowWidth().should.eventually.equal(800)
        .click('.btn-make-smaller')
        .pause(1000)
        .getWindowHeight().should.eventually.equal(390)
        .getWindowWidth().should.eventually.equal(790)
    })
  })
})
