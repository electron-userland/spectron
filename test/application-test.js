const { expect } = require('chai');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const helpers = require('./global-setup');
const { Application } = require('..');

const { describe, it, beforeEach, afterEach } = global;

describe('application loading', function () {
  helpers.setupTimeout(this);

  let app = null;
  let tempPath = null;

  beforeEach(function () {
    tempPath = temp.mkdirSync('spectron-temp-dir-');

    return helpers
      .startApplication({
        cwd: path.join(__dirname, 'fixtures'),
        args: [path.join(__dirname, 'fixtures', 'app'), '--foo', '--bar=baz'],
        env: {
          FOO: 'BAR',
          HELLO: 'WORLD',
          SPECTRON_TEMP_DIR: tempPath,
        },
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('launches the application', async function () {
    const response = await app.client.getWindowHandles();
    assert.strictEqual(response.length, 1);

    await app.browserWindow.getBounds().should.eventually.roughly(5).deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100,
    });
    await app.client.waitUntilTextExists('html', 'Hello');
    await app.client.getTitle().should.eventually.equal('Test');
  });

  it('throws an error when no path is specified', function () {
    return new Application().start().should.be.rejectedWith(Error, 'Application path must be a string');
  });

  describe('start()', function () {
    it('rejects with an error if the application does not exist', function () {
      return new Application({ path: path.join(__dirname, 'invalid') }).start().should.be.rejectedWith(Error);
    });

    it('rejects with an error if ChromeDriver does not start within the specified timeout', function () {
      return new Application({
        path: helpers.getElectronPath(),
        host: 'bad.host',
        startTimeout: 150,
      })
        .start()
        .should.be.rejectedWith(Error, 'ChromeDriver did not start within 150ms');
    });
  });

  describe('stop()', function () {
    it('quits the application', async function () {
      const quitPath = path.join(tempPath, 'quit.txt');
      assert.strictEqual(fs.existsSync(quitPath), false);
      const stoppedApp = await app.stop();
      assert.strictEqual(stoppedApp, app);
      assert.strictEqual(fs.existsSync(quitPath), true);
      assert.strictEqual(app.isRunning(), false);
    });

    it('rejects with an error if the application is not running', async function () {
      await app.stop();
      await expect(app.stop()).to.be.rejectedWith(Error);
    });
  });

  describe('restart()', function () {
    it('restarts the application', async function () {
      const quitPath = path.join(tempPath, 'quit.txt');
      assert.strictEqual(fs.existsSync(quitPath), false);
      const restartedApp = await app.restart();
      assert.strictEqual(restartedApp, app);
      assert.strictEqual(fs.existsSync(quitPath), true);
      assert.strictEqual(app.isRunning(), true);
    });

    it('rejects with an error if the application is not running', async function () {
      await app.stop();
      await expect(app.restart()).to.be.rejectedWith(Error);
    });
  });

  describe('getSettings()', function () {
    it('returns an object with all the configured options', function () {
      expect(app.getSettings().port).to.equal(9515);
      expect(app.getSettings().quitTimeout).to.equal(1000);
      expect(app.getSettings().env.SPECTRON_TEMP_DIR).to.equal(tempPath);
    });
  });

  describe('getRenderProcessLogs', function () {
    it('gets the render process console logs and clears them', async function () {
      await app.client.waitUntilWindowLoaded();
      let logs = await app.client.getRenderProcessLogs();
      expect(logs.length).to.equal(2); // no idea why this is only picking up the warn and error console events
      expect(logs[0].message).to.contain('7:14 "render warn"');
      expect(logs[0].source).to.equal('console-api');
      expect(logs[0].level).to.equal('WARNING');

      expect(logs[1].message).to.contain('8:14 "render error"');
      expect(logs[1].source).to.equal('console-api');
      expect(logs[1].level).to.equal('SEVERE');
      logs = await app.client.getRenderProcessLogs();
      expect(logs.length).to.equal(0);
    });
  });

  describe('getMainProcessLogs', function () {
    it('gets the main process console logs and clears them', async function () {
      await app.client.waitUntilWindowLoaded();
      let logs = await app.client.getMainProcessLogs();
      expect(logs).to.contain('main log');
      expect(logs).to.contain('main warn');
      expect(logs).to.contain('main error');
      logs = await app.client.getMainProcessLogs();
      expect(logs.length).to.equal(0);
    });

    it('does not include any deprecation warnings', async function () {
      await app.client.waitUntilWindowLoaded();
      const logs = await app.client.getMainProcessLogs();
      logs.forEach(function (log) {
        expect(log).not.to.contain('(electron)');
      });
    });

    it('clears the logs when the application is stopped', async function () {
      await app.stop();
      expect(app.chromeDriver.getLogs().length).to.equal(0);
    });
  });

  describe('browserWindow.capturePage', function () {
    it('returns a Buffer screenshot of the given rectangle', async function () {
      const buffer = await app.browserWindow.capturePage({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      });
      expect(buffer).to.be.an.instanceof(Buffer);
      expect(buffer.length).to.be.above(0);
    });

    it('returns a Buffer screenshot of the entire page when no rectangle is specified', async function () {
      const buffer = await app.browserWindow.capturePage();
      expect(buffer).to.be.an.instanceof(Buffer);
      expect(buffer.length).to.be.above(0);
    });
  });

  describe('webContents.savePage', function () {
    it('saves the page to the specified path', function () {
      const filePath = path.join(tempPath, 'page.html');
      return app.webContents.savePage(filePath, 'HTMLComplete').then(function () {
        const html = fs.readFileSync(filePath, 'utf8');
        expect(html).to.contain('<title>Test</title>');
        expect(html).to.contain('Hello');
      });
    });

    it('throws an error when the specified path is invalid', async function () {
      await expect(app.webContents.savePage(tempPath, 'MHTML')).to.be.rejectedWith(Error);
    });
  });

  describe('webContents.executeJavaScript', function () {
    it('executes the given script and returns the result of its last statement (sync)', async function () {
      const result = await app.webContents.executeJavaScript('1 + 2');
      expect(result).to.equal(3);
    });

    it('executes the given script and returns the result of its last statement (async)', async function () {
      const result = await app.webContents.executeJavaScript(`
        new Promise(function(resolve){
          setTimeout(function(){
            resolve("ok")
          }, 1000)
        })`);
      expect(result).to.equal('ok');
    });
  });

  describe('webContents.sendInputEvent', function () {
    it('triggers a keypress DOM event', async function () {
      await app.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'A' });
      const elem = await app.client.$('.keypress-count');
      let text = await elem.getText();
      expect(text).to.equal('A');
      await app.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'B' });
      text = await elem.getText();
      expect(text).to.equal('B');
    });
  });
});
