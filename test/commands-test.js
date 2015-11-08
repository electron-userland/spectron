var helpers = require('./global-setup')
var path = require('path')

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

  describe('getWindowBounds', function () {
    it('gets the window bounds', function () {
      return app.client.getWindowBounds().should.eventually.deep.equal({
        x: 25,
        y: 35,
        width: 200,
        height: 100
      })
    })
  })

  describe('getWindowWidth', function () {
    it('gets the window width', function () {
      return app.client.getWindowWidth().should.eventually.equal(200)
    })
  })

  describe('getWindowHeight', function () {
    it('gets the window height', function () {
      return app.client.getWindowHeight().should.eventually.equal(100)
    })
  })

  describe('setWindowBounds', function () {
    it('sets the window bounds', function () {
      return app.client
        .setWindowBounds({
          x: 100,
          y: 200,
          width: 50,
          height: 75
        })
        .pause(1000)
        .getWindowBounds().should.eventually.deep.equal({
          x: 100,
          y: 200,
          width: 50,
          height: 75
        })
    })
  })

  describe('isWindowFocused()', function () {
    it('returns true when the current window is focused', function () {
      return app.client.isWindowFocused().should.eventually.be.true
    })
  })

  describe('isWindowVisible()', function () {
    it('returns true when the window is visible, false otherwise', function () {
      return app.client
        .hideWindow()
        .isWindowVisible().should.eventually.be.false
        .showWindow()
        .isWindowVisible().should.eventually.be.true
    })
  })

  describe('isWindowDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function () {
      return app.client.isWindowDevToolsOpened().should.eventually.be.false
    })
  })

  describe('isWindowFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function () {
      return app.client.isWindowFullScreen().should.eventually.be.false
    })
  })

  describe('waitUntilWindowLoaded()', function () {
    it('waits until the current window is loaded', function () {
      return app.client.waitUntilWindowLoaded().isWindowLoading().should.eventually.be.false
    })
  })

  describe('isWindowMaximized()', function () {
    it('returns true when the window is maximized, false otherwise', function () {
      return app.client.isWindowMaximized().should.eventually.be.false
        .maximizeWindow().waitUntil(function () {
          // FIXME window maximized state is never true on CI
          if (process.env.CI) return Promise.resolve(true)

          return this.isWindowMaximized()
        }, 5000).then(function () { })
    })
  })

  describe('isWindowMinimized()', function () {
    it('returns true when the window is minimized, false otherwise', function () {
      return app.client.isWindowMinimized().should.eventually.be.false
        .minimizeWindow().waitUntil(function () {
          // FIXME window minimized state is never true on CI
          if (process.env.CI) return Promise.resolve(true)

          return this.isWindowMinimized()
        }, 5000).then(function () { })
    })
  })

  describe('selectAll()', function () {
    it('selects all the text on the page', function () {
      return app.client.selectAll()
        .getSelectedText().should.eventually.contain('Hello')
    })
  })

  describe('paste()', function () {
    it('pastes the text into the focused element', function () {
      return app.client
        .getText('textarea').should.eventually.equal('')
        .setClipboardText('pasta')
        .getClipboardText().should.eventually.equal('pasta')
        .click('textarea')
        .paste()
        .waitForValue('textarea', 5000)
        .getValue('textarea').should.eventually.equal('pasta')
    })
  })

  describe('isDocumentEdited', function () {
    it('returns true when the document is edited', function () {
      if (process.platform !== 'darwin') return

      return app.client
        .isDocumentEdited().should.eventually.be.false
        .setDocumentEdited(true)
        .isDocumentEdited().should.eventually.be.true
    })
  })

  describe('getRepresentedFilename', function () {
    it('returns the represented filename', function () {
      if (process.platform !== 'darwin') return

      return app.client
        .getRepresentedFilename().should.eventually.equal('')
        .setRepresentedFilename('/foo.js')
        .getRepresentedFilename().should.eventually.equal('/foo.js')
    })
  })

  describe('deprecated APIs', function () {
    describe('setWindowDimensions', function () {
      it('sets the bounds of the window', function () {
        return app.client
          .setWindowDimensions(100, 200, 50, 75)
          .pause(1000)
          .getWindowDimensions().should.eventually.deep.equal({
            x: 100,
            y: 200,
            width: 50,
            height: 75
          })
      })
    })
  })
})
