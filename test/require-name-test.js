const helpers = require('./global-setup');
const path = require('path');
const { expect } = require('chai');

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe('requireName option to Application', function () {
  helpers.setupTimeout(this);

  let app = null;

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'require-name')],
        requireName: 'electronRequire'
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('uses the custom require name to load the electron module', async function () {
    await app.client.waitUntilWindowLoaded();
    await app.browserWindow
      .getBounds()
      .should.eventually.roughly(5)
      .deep.equal({
        x: 25,
        y: 35,
        width: 200,
        height: 100
      });
    await app.webContents.getTitle().should.eventually.equal('require name');
    const emptyArgs = await app.electron.remote.process.execArgv();
    const elem = await app.client.$('body');
    const text = await elem.getText();
    expect(text).to.equal('custom require name');
    await app.webContents.getTitle().should.eventually.equal('require name');
    return expect(emptyArgs).to.be.empty;
  });
});
