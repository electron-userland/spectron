// Test for examples included in README.md
const helpers = require('./global-setup');
const path = require('path');
const { expect } = require('chai');

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe('example application launch', function () {
  helpers.setupTimeout(this);

  let app = null;

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'example')]
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
    const isDevOpen = await app.browserWindow.isDevToolsOpened();
    expect(isDevOpen).to.equal(false);
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).to.equal(true);
    const isFocused = await app.browserWindow.isFocused();
    expect(isFocused).to.equal(true);
    app.browserWindow
      .getBounds()
      .should.eventually.have.property('width')
      .and.be.above(0);
    app.browserWindow
      .getBounds()
      .should.eventually.have.property('height')
      .and.be.above(0);
  });

  describe('when the make larger button is clicked', function () {
    it('increases the window height and width by 10 pixels', async function () {
      await app.client.waitUntilWindowLoaded();
      app.browserWindow
        .getBounds()
        .should.eventually.have.property('width', 600);
      app.browserWindow
        .getBounds()
        .should.eventually.have.property('height', 400);
      const elem = await app.client.$('.btn-make-bigger');
      await elem.click();
      const bounds = await app.browserWindow.getBounds();
      bounds.should.have.property('width', 610);
      bounds.should.have.property('height', 410);
    });
  });

  describe('when the make smaller button is clicked', function () {
    it('decreases the window height and width by 10 pixels', async function () {
      await app.client.waitUntilWindowLoaded();
      app.browserWindow
        .getBounds()
        .should.eventually.have.property('width', 600);
      app.browserWindow
        .getBounds()
        .should.eventually.have.property('height', 400);
      const elem = await app.client.$('.btn-make-smaller');
      await elem.click();
      const bounds = await app.browserWindow.getBounds();
      bounds.should.have.property('width', 590);
      bounds.should.have.property('height', 390);
    });
  });
});
