var helpers = require('./global-setup')
var path = require('path')
var assert = require('assert')
const { expect } = require('chai')

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('when nodeIntegration is set to false', function () {
  helpers.setupTimeout(this)

  var app = null

  before(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'no-node-integration')]
      })
      .then(function (startedApp) {
        app = startedApp
      })
  })

  after(function () {
    return helpers.stopApplication(app)
  })

  it('does not throw an error', async function () {
    app.client.getTitle().should.eventually.equal('no node integration')
    var elem = await app.client.$('body')
    var text = await elem.getText()
    expect(text).to.equal('no node integration')
  })

  it('does not add Electron API helper methods', function () {
    assert.strictEqual(typeof app.electron, 'undefined')
    assert.strictEqual(typeof app.browserWindow, 'undefined')
    assert.strictEqual(typeof app.webContents, 'undefined')
    assert.strictEqual(typeof app.mainProcess, 'undefined')
    assert.strictEqual(typeof app.rendererProcess, 'undefined')

    assert.strictEqual(typeof app.client.electron, 'undefined')
    assert.strictEqual(typeof app.client.browserWindow, 'undefined')
    assert.strictEqual(typeof app.client.webContents, 'undefined')
    assert.strictEqual(typeof app.client.mainProcess, 'undefined')
    assert.strictEqual(typeof app.client.rendererProcess, 'undefined')
  })
})
