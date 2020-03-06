const helpers = require('./global-setup')
const path = require('path')

const describe = global.describe
const it = global.it
const beforeEach = global.beforeEach
const afterEach = global.afterEach

describe('requireName option to Application', function () {
  helpers.setupTimeout(this)

  let app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'require-name')],
      requireName: 'electronRequire'
    }).then((startedApp) => { app = startedApp })
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
