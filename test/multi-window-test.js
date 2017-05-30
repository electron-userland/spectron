var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('multiple windows', function () {
  helpers.setupTimeout(this)

  var app = null

  beforeEach(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'multi-window')]
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  it('launches the application', function () {
    return app.client
      .getWindowCount().should.eventually.equal(2)
      .windowByIndex(1)
        .browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
          x: 25,
          y: 35,
          width: 200,
          height: 100
        })
        .getTitle().should.eventually.equal('Top')
      .windowByIndex(0)
        .browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
          x: 25,
          y: 135,
          width: 300,
          height: 50
        })
        .getTitle().should.eventually.equal('Bottom')
  })
})
