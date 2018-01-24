var fs = require('fs')
var helpers = require('./global-setup')
var path = require('path')
var temp = require('temp').track()

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('window commands', function () {
  helpers.setupTimeout(this)

  var app = null

  before(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'app')]
    }).then(function (startedApp) { app = startedApp })
  })

  after(function () {
    return helpers.stopApplication(app)
  })

  describe('getWindowCount', function () {
    it('retrieves the window count', function () {
      return app.client.getWindowCount().should.eventually.equal(1)
    })
  })

  describe('waitUntilTextExists', function () {
    it('resolves if the element (single occurrence) contains the given text - full text', function () {
      return app.client.waitUntilTextExists('.occurrences-1', 'word1 word2').should.be.fulfilled
    })

    it('resolves if the element (single occurrence) contains the given text - partial text', function () {
      return app.client.waitUntilTextExists('.occurrences-1', 'word1').should.be.fulfilled
    })

    it('resolves if the element (multiple occurrences) contains the given text - full text', function () {
      return app.client.waitUntilTextExists('.occurrences-2', 'word3 word4').should.be.fulfilled
    })

    it('resolves if the element (multiple occurrences) contains the given text - partial text', function () {
      return app.client.waitUntilTextExists('.occurrences-2', 'word3').should.be.fulfilled
    })

    it('rejects if the element is missing', function () {
      return app.client.waitUntilTextExists('#not-in-page', 'Hello', 50).should.be.rejectedWith(Error, 'waitUntilTextExists Promise was rejected')
    })

    it('rejects if the element never contains the text', function () {
      return app.client.waitUntilTextExists('html', 'not on page', 50).should.be.rejectedWith(Error, 'waitUntilTextExists Promise was rejected')
    })
  })

  describe('browserWindow.getBounds()', function () {
    it('gets the window bounds', function () {
      return app.browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
        x: 25,
        y: 35,
        width: 200,
        height: 100
      })
    })
  })

  describe('browserWindow.setBounds()', function () {
    it('sets the window bounds', function () {
      return app.browserWindow.setBounds({
        x: 100,
        y: 200,
        width: 150, // Windows minimum is ~100px
        height: 130
      })
      .browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
        x: 100,
        y: 200,
        width: 150,
        height: 130
      })
    })
  })

  describe('browserWindow.isFocused()', function () {
    it('returns true when the current window is focused', function () {
      return app
        .browserWindow.show()
        .browserWindow.isFocused().should.eventually.be.true
    })
  })

  describe('browserWindow.isVisible()', function () {
    it('returns true when the window is visible, false otherwise', function () {
      return app.browserWindow.hide()
        .browserWindow.isVisible().should.eventually.be.false
        .browserWindow.show()
        .browserWindow.isVisible().should.eventually.be.true
    })
  })

  describe('browserWindow.isDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function () {
      return app.browserWindow.isDevToolsOpened().should.eventually.be.false
    })
  })

  describe('browserWindow.isFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function () {
      return app.client.browserWindow.isFullScreen().should.eventually.be.false
    })
  })

  describe('waitUntilWindowLoaded()', function () {
    it('waits until the current window is loaded', function () {
      return app.client.waitUntilWindowLoaded()
        .webContents.isLoading().should.eventually.be.false
    })
  })

  describe('browserWindow.isMaximized()', function () {
    it('returns true when the window is maximized, false otherwise', function () {
      return app.browserWindow.isMaximized().should.eventually.be.false
        .browserWindow.maximize().waitUntil(function () {
          // FIXME window maximized state is never true on CI
          if (process.env.CI) return Promise.resolve(true)

          return this.browserWindow.isMaximized()
        }, 5000).then(function () { })
    })
  })

  describe('browserWindow.isMinimized()', function () {
    it('returns true when the window is minimized, false otherwise', function () {
      return app.browserWindow.isMinimized().should.eventually.be.false
        .browserWindow.minimize().waitUntil(function () {
          // FIXME window minimized state is never true on CI
          if (process.env.CI) return Promise.resolve(true)

          return this.browserWindow.isMinimized()
        }, 5000).then(function () { })
    })
  })

  describe('webContents.selectAll()', function () {
    it('selects all the text on the page', function () {
      return app.client.getSelectedText().should.eventually.equal('')
        .webContents.selectAll()
        .getSelectedText().should.eventually.contain('Hello')
    })
  })

  describe('webContents.paste()', function () {
    it('pastes the text into the focused element', function () {
      return app.client
        .getText('textarea').should.eventually.equal('')
        .electron.clipboard.writeText('pasta')
        .electron.clipboard.readText().should.eventually.equal('pasta')
        .click('textarea')
        .webContents.paste()
        .waitForValue('textarea', 5000)
        .getValue('textarea').should.eventually.equal('pasta')
    })
  })

  describe('browserWindow.isDocumentEdited()', function () {
    it('returns true when the document is edited', function () {
      if (process.platform !== 'darwin') return

      return app.browserWindow.isDocumentEdited().should.eventually.be.false
        .browserWindow.setDocumentEdited(true)
        .browserWindow.isDocumentEdited().should.eventually.be.true
    })
  })

  describe('browserWindow.getRepresentedFilename()', function () {
    it('returns the represented filename', function () {
      if (process.platform !== 'darwin') return

      return app.browserWindow.getRepresentedFilename().should.eventually.equal('')
        .browserWindow.setRepresentedFilename('/foo.js')
        .browserWindow.getRepresentedFilename().should.eventually.equal('/foo.js')
    })
  })

  describe('electron.remote.app.getPath()', function () {
    it('returns the path for the given name', function () {
      var tempDir = fs.realpathSync(temp.dir)
      return app.electron.remote.app.setPath('music', tempDir)
        .electron.remote.app.getPath('music').should.eventually.equal(tempDir)
    })
  })

  it('exposes properties on constructor APIs', function () {
    return app.electron.remote.MenuItem.types().should.eventually.include('normal')
  })

  describe('globalShortcut.isRegistered()', function () {
    it('returns false if the shortcut is not registered', function () {
      return app.electron.remote.globalShortcut.isRegistered('CommandOrControl+X').should.eventually.be.false
    })
  })

  describe('rendererProcess.versions', function () {
    it('includes the Electron version', function () {
      return app.rendererProcess.versions().should.eventually.have.property('electron').and.not.be.empty
    })
  })

  describe('electron.screen.getPrimaryDisplay()', function () {
    it('returns information about the primary display', function () {
      return app.electron.screen.getPrimaryDisplay().should.eventually.have.property('workArea').and.not.be.empty
    })
  })

  describe('electron.webFrame.getZoomFactor()', function () {
    it('returns information about the primary display', function () {
      return app.electron.webFrame.setZoomFactor(4)
        .electron.webFrame.getZoomFactor().should.eventually.be.closeTo(4, 0.1)
    })
  })
})
