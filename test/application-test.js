var Application = require('..').Application
var assert = require('assert')
var fs = require('fs')
var helpers = require('./global-setup')
var path = require('path')
var temp = require('temp').track()

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('application loading', function () {
  helpers.setupTimeout(this)

  var app = null
  var tempPath = null

  beforeEach(function () {
    tempPath = temp.mkdirSync('spectron-temp-dir-')

    return helpers.startApplication({
      args: [
        path.join(__dirname, 'fixtures', 'app'),
        '--foo',
        '--bar=baz'
      ],
      env: {
        FOO: 'BAR',
        HELLO: 'WORLD',
        SPECTRON_TEMP_DIR: tempPath
      }
    }).then(function (startedApp) { app = startedApp })
  })

  afterEach(function () {
    return helpers.stopApplication(app)
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
      .getTitle().should.eventually.equal('Test')
  })

  it('passes through args to the launched app', function () {
    return app.client.getArgv()
      .should.eventually.contain('--foo')
      .should.eventually.contain('--bar=baz')
  })

  it('passes through env to the launched app', function () {
    var getEnv = function () { return process.env }
    return app.client.execute(getEnv).then(function (response) {
      if (process.platform === 'win32') {
        assert.equal(response.value.foo, 'BAR')
        assert.equal(response.value.hello, 'WORLD')
      } else {
        assert.equal(response.value.FOO, 'BAR')
        assert.equal(response.value.HELLO, 'WORLD')
      }
    })
  })

  describe('start()', function () {
    it('rejects with an error if the application does not exist', function () {
      return new Application({path: path.join(__dirname, 'invalid')})
        .start().should.be.rejectedWith(Error)
    })
  })

  describe('stop()', function () {
    it('quits the application', function () {
      var quitPath = path.join(tempPath, 'quit.txt')
      assert.equal(fs.existsSync(quitPath), false)
      return app.stop().then(function () {
        assert.equal(fs.existsSync(quitPath), true)
      })
    })

    it('rejects with an error if the application is not running', function () {
      return app.stop().should.be.fulfilled.then(function () {
        return app.stop().should.be.rejectedWith(Error)
      })
    })
  })
})
