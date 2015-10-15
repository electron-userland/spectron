var Application = require('../index').Application
var assert = require('assert')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('multiple windows', function () {
  this.timeout(10000)

  var app = null

  beforeEach(function () {
    app = new Application({
      path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      args: [
        path.join(__dirname, 'fixtures', 'multi-window')
      ]
    })
    return app.start()
  })

  afterEach(function () {
    return app.stop()
  })

  it('launches the application', function () {
    return app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 2)

      var bottomId = response.value[0]
      var topId = response.value[1]

      return this.window(topId).getWindowDimensions().then(function (dimensions) {
        assert.equal(dimensions.x, 25)
        assert.equal(dimensions.y, 35)
        assert.equal(dimensions.width, 200)
        assert.equal(dimensions.height, 100)
      }).getTitle().then(function (title) {
        assert.equal(title, 'Top')
      }).window(bottomId).getWindowDimensions().then(function (dimensions) {
        assert.equal(dimensions.x, 25)
        assert.equal(dimensions.y, 135)
        assert.equal(dimensions.width, 300)
        assert.equal(dimensions.height, 50)
      }).getTitle().then(function (title) {
        assert.equal(title, 'Bottom')
      })
    })
  })
})
