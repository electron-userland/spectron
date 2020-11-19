const fs = require('fs');
const helpers = require('./global-setup');
const path = require('path');
const { expect } = require('chai');
const temp = require('temp').track();

const describe = global.describe;
const it = global.it;
const before = global.before;
const after = global.after;

describe('window commands', function () {
  helpers.setupTimeout(this);

  let app = null;

  before(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'app')]
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  after(function () {
    return helpers.stopApplication(app);
  });

  describe('getWindowCount', function () {
    it('retrieves the window count', function () {
      return app.client.getWindowCount().should.eventually.equal(1);
    });
  });

  describe('waitUntilTextExists', function () {
    it('resolves if the element (single occurrence) contains the given text - full text', async function () {
      await app.client.waitUntilTextExists('.occurrences-1', 'word1 word2');
    });

    it('resolves if the element (single occurrence) contains the given text - partial text', async function () {
      await app.client.waitUntilTextExists('.occurrences-1', 'word1');
    });

    it('resolves if the element (multiple occurrences) contains the given text - full text', async function () {
      await app.client.waitUntilTextExists('.occurrences-2', 'word3 word4');
    });

    it('resolves if the element (multiple occurrences) contains the given text - partial text', async function () {
      await app.client.waitUntilTextExists('.occurrences-2', 'word3');
    });

    it('rejects if the element is missing', async function () {
      await expect(
        app.client.waitUntilTextExists('#not-in-page', 'Hello', 50)
      ).to.be.rejectedWith(Error);
    });

    it('rejects if the element never contains the text', async function () {
      await expect(
        app.client.waitUntilTextExists('html', 'not on page', 50)
      ).to.be.rejectedWith(Error);
    });
  });

  describe('browserWindow.getBounds()', function () {
    it('gets the window bounds', function () {
      return app.browserWindow
        .getBounds()
        .should.eventually.roughly(5)
        .deep.equal({
          x: 25,
          y: 35,
          width: 200,
          height: 100
        });
    });
  });

  describe('browserWindow.setBounds()', function () {
    it('sets the window bounds', async function () {
      await app.browserWindow.setBounds({
        x: 100,
        y: 200,
        width: 150, // Windows minimum is ~100px
        height: 130
      });
      app.browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
        x: 100,
        y: 200,
        width: 150,
        height: 130
      });
    });
  });

  describe('browserWindow.isFocused()', function () {
    it('returns true when the current window is focused', async function () {
      await app.browserWindow.show();
      const focused = await app.browserWindow.isFocused();
      return expect(focused).to.be.true;
    });
  });

  describe('browserWindow.isVisible()', function () {
    it('returns true when the window is visible, false otherwise', async function () {
      await app.browserWindow.hide();
      const isInvisible = await app.browserWindow.isVisible();
      await app.browserWindow.show();
      const isVisible = await app.browserWindow.isVisible();
      return expect(isVisible).to.be.true && expect(isInvisible).to.be.false;
    });
  });

  describe('browserWindow.isDevToolsOpened()', function () {
    it('returns false when the dev tools are closed', function () {
      return app.browserWindow.isDevToolsOpened().should.eventually.be.false;
    });
  });

  describe('browserWindow.isFullScreen()', function () {
    it('returns false when the window is not in full screen mode', function () {
      return app.client.browserWindow.isFullScreen().should.eventually.be.false;
    });
  });

  describe('waitUntilWindowLoaded()', function () {
    it('waits until the current window is loaded', async function () {
      await app.client.waitUntilWindowLoaded();
      return app.webContents.isLoading().should.eventually.be.false;
    });
  });

  describe('browserWindow.isMaximized()', function () {
    it('returns true when the window is maximized, false otherwise', async function () {
      const notMaximized = await app.browserWindow.isMaximized();
      expect(notMaximized).to.equal(false);
      await app.browserWindow.maximize();
      let maximized = await app.browserWindow.isMaximized();
      if (process.env.CI) {
        // FIXME window maximized state is never true on CI
        maximized = true;
      }
      expect(maximized).to.equal(true);
    });
  });

  describe('browserWindow.isMinimized()', function () {
    it('returns true when the window is minimized, false otherwise', async function () {
      const notMinimized = await app.browserWindow.isMinimized();
      expect(notMinimized).to.equal(false);
      await app.browserWindow.minimize();
      let minimized = await app.browserWindow.isMinimized();
      if (process.env.CI) {
        // FIXME window minimized state is never true on CI
        minimized = true;
      }
      expect(minimized).to.equal(true);
    });
  });

  describe('webContents.selectAll()', function () {
    it('selects all the text on the page', async function () {
      app.client.waitUntilTextExists('html', 'Hello');
      let text = await app.client.getSelectedText();
      expect(text).to.equal('');
      app.client.webContents.selectAll();
      text = await app.client.getSelectedText();
      expect(text).to.contain('Hello');
    });
  });

  describe('webContents.paste()', function () {
    it('pastes the text into the focused element', async function () {
      const elem = await app.client.$('textarea');
      const text = await elem.getText('textarea');
      expect(text).to.equal('');
      app.electron.clipboard.writeText('pasta');
      app.electron.clipboard.readText().should.eventually.equal('pasta');
      await elem.click();
      app.webContents.paste();
      const value = await elem.getValue('textarea');
      return expect(value).to.equal('pasta');
    });
  });

  describe('browserWindow.isDocumentEdited()', function () {
    it('returns true when the document is edited', async function () {
      if (process.platform !== 'darwin') return;

      const notEdited = await app.browserWindow.isDocumentEdited();
      expect(notEdited).to.equal(false);
      app.browserWindow.setDocumentEdited(true);
      return app.browserWindow.isDocumentEdited().should.eventually.be.true;
    });
  });

  describe('browserWindow.getRepresentedFilename()', function () {
    it('returns the represented filename', async function () {
      if (process.platform !== 'darwin') return;

      let filename = await app.browserWindow.getRepresentedFilename();
      expect(filename).to.equal('');
      await app.browserWindow.setRepresentedFilename('/foo.js');
      filename = await app.browserWindow.getRepresentedFilename();
      return expect(filename).to.equal('/foo.js');
    });
  });

  describe('electron.remote.app.getPath()', function () {
    it('returns the path for the given name', async function () {
      const tempDir = fs.realpathSync(temp.dir);
      await app.electron.remote.app.setPath('music', tempDir);
      return app.electron.remote.app
        .getPath('music')
        .should.eventually.equal(tempDir);
    });
  });

  it('exposes properties on constructor APIs', function () {
    app.electron.remote.MenuItem.types().should.eventually.include('normal');
  });

  describe('remote.globalShortcut.isRegistered()', function () {
    it('returns false if the shortcut is not registered', function () {
      return app.electron.remote.globalShortcut.isRegistered(
        'CommandOrControl+X'
      ).should.eventually.be.false;
    });
  });

  describe('rendererProcess.versions', function () {
    it('includes the Electron version', function () {
      return app.rendererProcess
        .versions()
        .should.eventually.have.property('electron').and.not.be.empty;
    });
  });

  describe('electron.remote.screen.getPrimaryDisplay()', function () {
    // In Electron 11, the screen module now export a proxy
    // which lazily calls createScreen on first access. This
    // is causing an error with remote's screen API methods.
    // PR: https://github.com/electron/electron/pull/24677
    it.skip('returns information about the primary display', function () {
      return app.electron.remote.screen
        .getPrimaryDisplay()
        .should.eventually.have.property('workArea').and.not.be.empty;
    });
  });

  describe('electron.webFrame.getZoomFactor()', function () {
    it('returns information about the primary display', async function () {
      await app.electron.webFrame.setZoomFactor(4);
      return app.electron.webFrame
        .getZoomFactor()
        .should.eventually.be.closeTo(4, 0.1);
    });
  });
});
