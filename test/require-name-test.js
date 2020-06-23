var helpers = require('./global-setup')
var path = require('path')
const { expect } = require('chai')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('requireName option to Application', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'require-name')],
        requireName: 'electronRequire'
      })
      .then(function (startedApp) {
        app = startedApp
      })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('uses the custom require name to load the electron module', async function () {
    await app.client.waitUntilWindowLoaded()
    app.browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100
    })
    app.webContents.getTitle().should.eventually.equal('require name')
    const emptyArgs = await app.electron.remote.process.execArgv()
    const elem = await app.client.$('body')
    var text = await elem.getText()
    expect(text).to.equal('custom require name')
    app.webContents.getTitle().should.eventually.equal('require name')
    return expect(emptyArgs).to.be.empty
  })
})
