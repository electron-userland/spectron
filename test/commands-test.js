var Application = require('../index').Application
var assert = require('assert')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('window commands', function () {
  this.timeout(10000)

  var app = null

  beforeEach(function (done) {
    app = new Application({
      path: path.join(__dirname, 'fixtures', 'app', 'app.js')
    })
    app.start().then(done, done)
  })

  afterEach(function (done) {
    if (app) {
      app.stop().then(done, done)
    } else {
      done()
    }
    app = null
  })

  describe('setWindowDimensions', function () {
    it('sets the window dimensions', function (done) {
      app.client.setWindowDimensions(100, 200, 50, 75).getWindowDimensions().then(function (dimensions) {
        assert.equal(dimensions.x, 100)
        assert.equal(dimensions.y, 200)
        assert.equal(dimensions.width, 50)
        assert.equal(dimensions.height, 75)
      }).then(done, done)
    })
  })
})
