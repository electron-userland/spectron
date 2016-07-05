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
      .browserWindow.focus()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })

  describe('when the make larger button is clicked', function () {
    it('increases the window height and width by 10 pixels', function () {
      return app.client.waitUntilWindowLoaded()
        .browserWindow.getBounds().should.eventually.have.property('width', 800)
        .browserWindow.getBounds().should.eventually.have.property('height', 400)
        .click('.btn-make-bigger')
        .browserWindow.getBounds().should.eventually.have.property('width', 810)
        .browserWindow.getBounds().should.eventually.have.property('height', 410)
    })
  })

  describe('when the make smaller button is clicked', function () {
    it('decreases the window height and width by 10 pixels', function () {
      return app.client.waitUntilWindowLoaded()
        .browserWindow.getBounds().should.eventually.have.property('width', 800)
        .browserWindow.getBounds().should.eventually.have.property('height', 400)
        .click('.btn-make-smaller')
        .browserWindow.getBounds().should.eventually.have.property('width', 790)
        .browserWindow.getBounds().should.eventually.have.property('height', 390)
    })
  })
})
