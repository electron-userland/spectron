var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('requireName option to Application', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'require-name')],
      requireName: 'electronRequire'
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('uses the custom require name to load the electron module', function () {
    return app.client.waitUntilWindowLoaded()
      .browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
        x: 25,
        y: 35,
        width: 200,
        height: 100
      })
      .webContents.getTitle().should.eventually.equal('require name')
      .electron.remote.process.execArgv().should.eventually.be.empty
      .getText('body').should.eventually.equal('custom require name')
      .getTitle().should.eventually.equal('require name')
  })
})
