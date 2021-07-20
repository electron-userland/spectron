// Test for examples included in README.md
const path = require('path');
const { expect } = require('chai');
const helpers = require('./global-setup');

const { describe, it, beforeEach, afterEach } = global;

describe('example application launch', function () {
  helpers.setupTimeout(this);

  let app = null;

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'example')],
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('opens a window', async function () {
    await app.client.waitUntilWindowLoaded();
    app.browserWindow.focus();
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).to.equal(1);
    const isMinimized = await app.browserWindow.isMinimized();
    expect(isMinimized).to.equal(false);
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).to.equal(true);
    const isFocused = await app.browserWindow.isFocused();
    expect(isFocused).to.equal(true);
    await app.browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0);
    await app.browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0);
  });

  describe('when the make larger button is clicked', function () {
    it('increases the window height and width by 10 pixels', async function () {
      await app.client.waitUntilWindowLoaded();
      await app.browserWindow.getBounds().should.eventually.have.property('width', 800);
      await app.browserWindow.getBounds().should.eventually.have.property('height', 400);
      const elem = await app.client.$('.btn-make-bigger');
      await elem.click();
      await app.browserWindow.getBounds().should.eventually.have.property('width', 810);
      await app.browserWindow.getBounds().should.eventually.have.property('height', 410);
    });
  });

  describe('when the make smaller button is clicked', function () {
    it('decreases the window height and width by 10 pixels', async function () {
      app.client.setTimeout({ script: 60000 });
      await app.client.waitUntilWindowLoaded();
      await app.browserWindow.getBounds().should.eventually.have.property('width', 800);
      await app.browserWindow.getBounds().should.eventually.have.property('height', 400);
      const elem = await app.client.$('.btn-make-smaller');
      await elem.click();
      await app.browserWindow.getBounds().should.eventually.have.property('width', 790);
      await app.browserWindow.getBounds().should.eventually.have.property('height', 390);
    });
  });
});
