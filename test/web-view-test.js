var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('<webview> tags', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'web-view')]
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('allows the web view to be accessed', function () {
    // waiting for windowHandles ensures waitUntilWindowLoaded doesn't access a nil webContents.
    // TODO: this issue should be fixed by waitUntilWindowLoaded instead of this workaround.
    return app.client.windowHandles()
      .waitUntilWindowLoaded()
      .waitUntil(function () {
        return this.getWindowCount().then(function (count) {
          return count === 2
        })
      })
      .windowByIndex(1)
      .getText('body').should.eventually.equal('web view')
      .getTitle().should.eventually.equal('Web View')
  })
})
