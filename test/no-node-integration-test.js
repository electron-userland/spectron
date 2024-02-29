const helpers = require('./global-setup');
const path = require('path');
const assert = require('assert');
const { expect } = require('chai');

const describe = global.describe;
const it = global.it;
const before = global.before;
const after = global.after;

const skipIfWindows = process.platform === 'win32' ? describe.skip : describe;

skipIfWindows('when nodeIntegration is set to false', function () {
  helpers.setupTimeout(this);

  let app = null;

  before(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'no-node-integration')]
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  after(function () {
    return helpers.stopApplication(app);
  });

  it('does not throw an error', async function () {
    await app.client.getTitle().should.eventually.equal('no node integration');
    const elem = await app.client.$('body');
    const text = await elem.getText();
    expect(text).to.equal('no node integration');
  });

  it('does not add Electron API helper methods', function () {
    assert.strictEqual(typeof app.electron, 'undefined');
    assert.strictEqual(typeof app.browserWindow, 'undefined');
    assert.strictEqual(typeof app.webContents, 'undefined');
    assert.strictEqual(typeof app.mainProcess, 'undefined');
    assert.strictEqual(typeof app.rendererProcess, 'undefined');

    assert.strictEqual(typeof app.client.electron, 'undefined');
    assert.strictEqual(typeof app.client.browserWindow, 'undefined');
    assert.strictEqual(typeof app.client.webContents, 'undefined');
    assert.strictEqual(typeof app.client.mainProcess, 'undefined');
    assert.strictEqual(typeof app.client.rendererProcess, 'undefined');
  });
});
