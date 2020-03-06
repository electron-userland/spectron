const helpers = require('./global-setup')
const path = require('path')

const describe = global.describe
const it = global.it
const beforeEach = global.beforeEach
const afterEach = global.afterEach

describe('<webview> tags', function () {
  helpers.setupTimeout(this)

  let app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'web-view')]
    }).then((startedApp) => { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('allows the web view to be accessed', function () {
    // waiting for windowHandles ensures waitUntilWindowLoaded doesn't access a nil webContents.
    // TODO: this issue should be fixed by waitUntilWindowLoaded instead of this workaround.
    return app.client.windowHandles()
      .waitUntilWindowLoaded()
      .waitUntil(() => {
        return app.client.getWindowCount().then((count) => {
          return count === 2
        })
      })
      .windowByIndex(1)
      .getText('body').should.eventually.equal('web view')
      .getTitle().should.eventually.equal('Web View')
  })
})
