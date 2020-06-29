const helpers = require('./global-setup');
const path = require('path');

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe('multiple windows', function () {
  helpers.setupTimeout(this);

  let app = null;

  beforeEach(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'multi-window')]
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('should switch focus thanks to windowByIndex', async function () {
    // TODO
    const windowCount = await app.client.getWindowCount();
    windowCount.should.equal(2);

    const windowsData = {};

    await app.client.windowByIndex(0);
    const window0Title = await app.browserWindow.getTitle();
    const window0Bounds = await app.browserWindow.getBounds();
    windowsData[window0Title] = window0Bounds;

    await app.client.windowByIndex(1);
    const window1Title = await app.browserWindow.getTitle();
    const window1Bounds = await app.browserWindow.getBounds();
    windowsData[window1Title] = window1Bounds;

    windowsData.Top.should.roughly(5).deep.equal({
      x: 25,
      y: 35,
      width: 200,
      height: 100
    });
    windowsData.Bottom.should.roughly(5).deep.equal({
      x: 25,
      y: 135,
      width: 300,
      height: 50
    });
  });

  it('should switch focus thanks to switchWindow', async function () {
    const windowCount = await app.client.getWindowCount();
    windowCount.should.equal(2);
    await app.client.switchWindow('Top');
    app.client.getTitle().should.eventually.equal('Top');
    await app.client.switchWindow('Bottom');
    app.client.getTitle().should.eventually.equal('Bottom');
    await app.client.switchWindow('index-top.html');
    app.client.getTitle().should.eventually.equal('Top');
    await app.client.switchWindow('index-bottom.html');
    app.client.getTitle().should.eventually.equal('Bottom');
  });
});
