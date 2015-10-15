// Test for examples included in README.md
var Application = require('..').Application
var chaiAsPromised = require('chai-as-promised')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('application launch', function () {
  this.timeout(10000)

  beforeEach(function () {
    this.app = new Application({
      path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      args: [
        path.join(__dirname, 'fixtures', 'app')
      ]
    })
    return this.app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.client.transferPromiseness
  })

  afterEach(function () {
    return this.app.stop()
  })

  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
      .isWindowMinimized().should.eventually.be.false
      .isWindowVisible().should.eventually.be.true
      .isWindowFocused().should.eventually.be.true
      .getWindowWidth().should.eventually.be.above(0)
      .getWindowHeight().should.eventually.be.above(0)
  })
})
