const path = require('path');
const helpers = require('./global-setup');

const { describe, it, before, after } = global;

describe('multiple windows', function () {
  helpers.setupTimeout(this);

  let app = null;

  before(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'multi-window')],
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  after(function () {
    return helpers.stopApplication(app);
  });

  it('should switch focus using windowByIndex', async function () {
    const windowCount = await app.client.getWindowCount();
    windowCount.should.equal(2);
    await app.client.windowByIndex(0);
    await app.client.getTitle().should.eventually.equal('Top');
    await app.client.windowByIndex(1);
    await app.client.getTitle().should.eventually.equal('Bottom');
    await app.client.windowByIndex(0);
    await app.client.getTitle().should.eventually.equal('Top');
    await app.client.windowByIndex(1);
    await app.client.getTitle().should.eventually.equal('Bottom');
  });
});
