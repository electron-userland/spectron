var assert = require('assert')
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
    return app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 2)

      var bottomId = response.value[0]
      var topId = response.value[1]

      return this.window(topId)
        .getWindowBounds().should.eventually.deep.equal({
          x: 25,
          y: 35,
          width: 200,
          height: 100
        })
        .getTitle().should.eventually.equal('Top')
      .window(bottomId)
        .getWindowBounds().should.eventually.deep.equal({
          x: 25,
          y: 135,
          width: 300,
          height: 50
        })
        .getTitle().should.eventually.equal('Bottom')
    })
  })
})
