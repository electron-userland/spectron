var helpers = require('./global-setup')
var path = require('path')
var expect = require('chai').expect

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('when nodeIntegration is set to false', function () {
  helpers.setupTimeout(this)

  var app = null

  before(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'no-node-integration')]
    }).then(function (startedApp) { app = startedApp })
  })

  after(function () {
    return helpers.stopApplication(app)
  })

  it('does not throw an error', function () {
    return app.client.getTitle().should.eventually.equal('no node integration')
      .getText('body').should.eventually.equal('no node integration')
  })

  it('does not add Electron API helper methods', function () {
    expect(app.electron).to.be.undefined
    expect(app.browserWindow).to.be.undefined
    expect(app.webContents).to.be.undefined
    expect(app.mainProcess).to.be.undefined
    expect(app.rendererProcess).to.be.undefined

    expect(app.client.electron).to.be.undefined
    expect(app.client.browserWindow).to.be.undefined
    expect(app.client.webContents).to.be.undefined
    expect(app.client.mainProcess).to.be.undefined
    expect(app.client.rendererProcess).to.be.undefined
  })
})
