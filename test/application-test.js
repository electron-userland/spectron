var Application = require('../index').Application
var assert = require('assert')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('application loading', function () {
  this.timeout(10000)

  var app = null

  beforeEach(function (done) {
    app = new Application({
      path: path.join(__dirname, 'fixtures', 'app', 'app.js')
    })
    app.start(done)
  })

  afterEach(function (done) {
    if (app) {
      app.stop(done)
    }
    app = null
  })

  it('launches the application', function (done) {
    app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 1)
    }).getWindowDimensions().then(function (dimensions) {
      assert.equal(dimensions.x, 25)
      assert.equal(dimensions.y, 35)
      assert.equal(dimensions.width, 200)
      assert.equal(dimensions.height, 100)
    }).waitUntilContainsText('html', 'Hello').then(done, done)
  })
})
