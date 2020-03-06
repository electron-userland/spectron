const helpers = require('./global-setup')
const path = require('path')

const describe = global.describe
const it = global.it
const before = global.before
const after = global.after

describe('Slow loading page', function () {
  helpers.setupTimeout(this)

  let app = null

  before(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'slow')]
    }).then((startedApp) => { app = startedApp })
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
