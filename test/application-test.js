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
var expect = require('chai').expect

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
    }).getWindowBounds().should.eventually.deep.equal({
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

  describe('getRenderProcessLogs', function () {
    it('gets the console logs and clears them', function () {
      return app.client.waitUntilWindowLoaded()
        .getRenderProcessLogs().then(function (logs) {
          expect(logs.length).to.equal(3)

          expect(logs[0].message).to.contain('7:15 log')
          expect(logs[0].source).to.equal('console-api')
          expect(logs[0].level).to.equal('INFO')

          expect(logs[1].message).to.contain('8:15 warn')
          expect(logs[1].source).to.equal('console-api')
          expect(logs[1].level).to.equal('WARNING')

          expect(logs[2].message).to.contain('9:15 error')
          expect(logs[2].source).to.equal('console-api')
          expect(logs[2].level).to.equal('SEVERE')
        })
        .getRenderProcessLogs().then(function (logs) {
          expect(logs.length).to.equal(0)
        })
    })
  })
})
