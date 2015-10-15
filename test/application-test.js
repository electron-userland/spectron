var Application = require('../index').Application
var assert = require('assert')
var chaiAsPromised = require('chai-as-promised')
var fs = require('fs')
var path = require('path')
var temp = require('temp').track()

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('application loading', function () {
  this.timeout(10000)

  var app = null

  beforeEach(function () {
    process.env.SPECTRON_TEMP_DIR = temp.mkdirSync('spectron-temp-dir-')
    app = new Application({
      path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      args: [
        path.join(__dirname, 'fixtures', 'app'),
        '--foo',
        '--bar=baz'
      ],
      env: {
        'FOO': 'BAR',
        'HELLO': 'WORLD'
      }
    })
    return app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = app.client.transferPromiseness
  })

  afterEach(function () {
    if (app) return app.stop()
  })

  it('launches the application', function () {
    return app.client.windowHandles().then(function (response) {
      assert.equal(response.value.length, 1)
    }).getWindowDimensions().should.eventually.deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100
    }).waitUntilTextExists('html', 'Hello')
  })

  it('passes through args to the launched app', function () {
    var getArgv = function () {
      return require('remote').getGlobal('process').argv
    }
    return app.client.execute(getArgv).then(function (response) {
      assert.notEqual(response.value.indexOf('--foo'), -1)
      assert.notEqual(response.value.indexOf('--bar=baz'), -1)
    })
  })

  it('passes through env to the launched app', function () {
    var getEnv = function () {
      return process.env
    }
    return app.client.execute(getEnv).then(function (response) {
      assert.equal(response.value['FOO'], 'BAR')
      assert.equal(response.value['HELLO'], 'WORLD')
    })
  })

  describe('stop()', function () {
    it('quits the application', function () {
      var quitPath = path.join(process.env.SPECTRON_TEMP_DIR, 'quit.txt')
      assert.equal(fs.existsSync(quitPath), false)
      return app.stop().then(function () {
        app = null
        assert.equal(fs.existsSync(quitPath), true)
      })
    })
  })
})
