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
      cwd: path.join(__dirname, 'fixtures'),
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
    }).browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100
    }).waitUntilTextExists('html', 'Hello')
      .getTitle().should.eventually.equal('Test')
  })

  it('passes through args to the launched app', function () {
    return app.mainProcess.argv()
      .should.eventually.contain('--foo')
      .should.eventually.contain('--bar=baz')
  })

  it('passes through env to the launched app', function () {
    return app.rendererProcess.env().then(function (env) {
      if (process.platform === 'win32') {
        assert.equal(env.foo, 'BAR')
        assert.equal(env.hello, 'WORLD')
      } else {
        assert.equal(env.FOO, 'BAR')
        assert.equal(env.HELLO, 'WORLD')
      }
    })
  })

  it('passes through cwd to the launched app', function () {
    return app.mainProcess.cwd().should.eventually.equal(path.join(__dirname, 'fixtures'))
  })

  it('throws an error when no path is specified', function () {
    return new Application().start().should.be.rejectedWith(Error, 'Application path must be a string')
  })

  describe('start()', function () {
    it('rejects with an error if the application does not exist', function () {
      return new Application({path: path.join(__dirname, 'invalid')})
        .start().should.be.rejectedWith(Error)
    })

    it('rejects with an error if ChromeDriver does not start within the specified timeout', function () {
      return new Application({path: helpers.getElectronPath(), host: 'bad.host', startTimeout: 150})
        .start().should.be.rejectedWith(Error, 'ChromeDriver did not start within 150ms')
    })
  })

  describe('stop()', function () {
    it('quits the application', function () {
      var quitPath = path.join(tempPath, 'quit.txt')
      assert.equal(fs.existsSync(quitPath), false)
      return app.stop().then(function (stoppedApp) {
        assert.equal(stoppedApp, app)
        assert.equal(fs.existsSync(quitPath), true)
        assert.equal(app.isRunning(), false)
      })
    })

    it('rejects with an error if the application is not running', function () {
      return app.stop().should.be.fulfilled.then(function () {
        return app.stop().should.be.rejectedWith(Error)
      })
    })
  })

  describe('restart()', function () {
    it('restarts the application', function () {
      var quitPath = path.join(tempPath, 'quit.txt')
      assert.equal(fs.existsSync(quitPath), false)
      return app.restart().then(function (restartedApp) {
        assert.equal(restartedApp, app)
        assert.equal(fs.existsSync(quitPath), true)
        assert.equal(app.isRunning(), true)
      })
    })

    it('rejects with an error if the application is not running', function () {
      return app.stop().should.be.fulfilled.then(function () {
        return app.restart().should.be.rejectedWith(Error)
      })
    })
  })

  describe('getSettings()', function () {
    it('returns an object with all the configured options', function () {
      expect(app.getSettings().port).to.equal(9515)
      expect(app.getSettings().quitTimeout).to.equal(1000)
      expect(app.getSettings().env.SPECTRON_TEMP_DIR).to.equal(tempPath)
    })
  })

  describe('getRenderProcessLogs', function () {
    it('gets the render process console logs and clears them', function () {
      return app.client.waitUntilWindowLoaded()
        .getRenderProcessLogs().then(function (logs) {
          expect(logs.length).to.equal(3)

          expect(logs[0].message).to.contain('6:14 "render log"')
          expect(logs[0].source).to.equal('console-api')
          expect(logs[0].level).to.equal('INFO')

          expect(logs[1].message).to.contain('7:14 "render warn"')
          expect(logs[1].source).to.equal('console-api')
          expect(logs[1].level).to.equal('WARNING')

          expect(logs[2].message).to.contain('8:14 "render error"')
          expect(logs[2].source).to.equal('console-api')
          expect(logs[2].level).to.equal('SEVERE')
        })
        .getRenderProcessLogs().then(function (logs) {
          expect(logs.length).to.equal(0)
        })
    })
  })

  describe('getMainProcessLogs', function () {
    it('gets the main process console logs and clears them', function () {
      return app.client.waitUntilWindowLoaded()
        .getMainProcessLogs().then(function (logs) {
          expect(logs).to.contain('main log')
          expect(logs).to.contain('main warn')
          expect(logs).to.contain('main error')
        })
        .getMainProcessLogs().then(function (logs) {
          expect(logs.length).to.equal(0)
        })
    })

    it('does not include any deprecation warnings', function () {
      return app.client.waitUntilWindowLoaded()
        .getMainProcessLogs().then(function (logs) {
          logs.forEach(function (log) {
            expect(log).not.to.contain('(electron)')
          })
        })
    })

    it('clears the logs when the application is stopped', function () {
      return app.stop().then(function () {
        expect(app.chromeDriver.getLogs().length).to.equal(0)
      })
    })
  })

  describe('electron.remote.getGlobal', function () {
    it('returns the requested global from the main process', function () {
      return app.electron.remote.getGlobal('mainProcessGlobal').should.eventually.equal('foo')
    })
  })

  describe('browserWindow.capturePage', function () {
    it('returns a Buffer screenshot of the given rectangle', function () {
      return app.browserWindow.capturePage({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      }).then(function (buffer) {
        expect(buffer).to.be.an.instanceof(Buffer)
        expect(buffer.length).to.be.above(0)
      })
    })

    it('returns a Buffer screenshot of the entire page when no rectangle is specified', function () {
      return app.browserWindow.capturePage().then(function (buffer) {
        expect(buffer).to.be.an.instanceof(Buffer)
        expect(buffer.length).to.be.above(0)
      })
    })
  })

  describe('webContents.savePage', function () {
    it('saves the page to the specified path', function () {
      var filePath = path.join(tempPath, 'page.html')
      return app.webContents.savePage(filePath, 'HTMLComplete').then(function () {
        var html = fs.readFileSync(filePath, 'utf8')
        expect(html).to.contain('<title>Test</title>')
        expect(html).to.contain('Hello')
      })
    })

    it('throws an error when the specified path is invalid', function () {
      return app.webContents.savePage(tempPath, 'MHTML').should.be.rejectedWith(Error)
    })
  })

  describe('electron.ipcRenderer.send', function () {
    it('sends the message to the main process', function () {
      return app.electron.remote.getGlobal('ipcEventCount').should.eventually.equal(0)
        .electron.ipcRenderer.send('ipc-event', 123)
        .electron.remote.getGlobal('ipcEventCount').should.eventually.equal(123)
        .electron.ipcRenderer.send('ipc-event', 456)
        .electron.remote.getGlobal('ipcEventCount').should.eventually.equal(579)
    })
  })

  describe('webContents.sendInputEvent', function () {
    it('triggers a keypress DOM event', function () {
      return app.webContents.sendInputEvent({type: 'keyDown', keyCode: 'A'})
        .getText('.keypress-count').should.eventually.equal('A')
        .webContents.sendInputEvent({type: 'keyDown', keyCode: 'B'})
        .getText('.keypress-count').should.eventually.equal('B')
    })
  })
})
