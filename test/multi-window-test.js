var Application = require('..').Application
var assert = require('assert')
var chaiAsPromised = require('chai-as-promised')
var helpers = require('./global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('multiple windows', function () {
  var app = null

  beforeEach(function () {
    app = new Application({
      path: helpers.getElectronPath(),
      args: [
        path.join(__dirname, 'fixtures', 'multi-window')
      ]
    })
    return app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = app.client.transferPromiseness
  })

  afterEach(function () {
    if (app.isRunning()) return app.stop()
  })

  it('launches the application', function () {
    return app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 2)

      var bottomId = response.value[0]
      var topId = response.value[1]

      return this.window(topId)
        .getWindowDimensions().should.eventually.deep.equal({
          x: 25,
          y: 35,
          width: 200,
          height: 100
        })
        .getTitle().should.eventually.equal('Top')
      .window(bottomId)
        .getWindowDimensions().should.eventually.deep.equal({
          x: 25,
          y: 135,
          width: 300,
          height: 50
        })
        .getTitle().should.eventually.equal('Bottom')
    })
  })
})
