var helpers = require('./global-setup')
var path = require('path')
const { expect } = require('chai')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('<webview> tags', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'web-view')]
      })
      .then(function (startedApp) {
        app = startedApp
      })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('allows the web view to be accessed', async function () {
    // waiting for windowHandles ensures waitUntilWindowLoaded doesn't access a nil webContents.
    // TODO: this issue should be fixed by waitUntilWindowLoaded instead of this workaround.
    await app.client.getWindowHandles()
    await app.client.waitUntilWindowLoaded()
    const count = await app.client.getWindowCount()
    expect(count).to.equal(2)
    await app.client.windowByIndex(1)
    var elem = await app.client.$('body')
    var text = await elem.getText()
    expect(text).to.equal('web view')
    app.webContents.getTitle().should.eventually.equal('Web View')
  })
})
