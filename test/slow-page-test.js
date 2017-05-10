var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('Slow loading page', function () {
  helpers.setupTimeout(this)

  var app = null

  before(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'slow')]
    }).then(function (startedApp) { app = startedApp })
  })

  after(function () {
    return helpers.stopApplication(app)
  })

  describe('webContents.isLoading()', function () {
    it('resolves to true', function () {
      return app.webContents.isLoading().should.eventually.be.true
    })
  })

  describe('waitUntilWindowLoaded(timeout)', function () {
    it('rejects with an error when the timeout is hit', function () {
      return app.client.waitUntilWindowLoaded(100).should.be.rejectedWith(Error, 'waitUntilWindowLoaded Promise was rejected')
    })
  })
})
