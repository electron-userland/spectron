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
        args: [path.join(__dirname, 'fixtures', 'multi-window')],
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('should switch focus using switchWindow', async function () {
    const windowCount = await app.client.getWindowCount();
    windowCount.should.equal(2);
    await app.client.switchWindow('Top');
    await app.client.getTitle().should.eventually.equal('Top');
    await app.client.switchWindow('Bottom');
    await app.client.getTitle().should.eventually.equal('Bottom');
    await app.client.switchWindow('index-top.html');
    await app.client.getTitle().should.eventually.equal('Top');
    await app.client.switchWindow('index-bottom.html');
    await app.client.getTitle().should.eventually.equal('Bottom');
  });
});
