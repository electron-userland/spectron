const helpers = require('./global-setup');
const path = require('path');
const expect = require('chai').expect;

const describe = global.describe;
const it = global.it;
const before = global.before;
const after = global.after;

describe('Slow loading page', function () {
  helpers.setupTimeout(this);

  let app = null;

  before(function () {
    return helpers
      .startApplication({
        args: [path.join(__dirname, 'fixtures', 'slow')]
      })
      .then(function (startedApp) {
        app = startedApp;
      });
  });

  after(function () {
    return helpers.stopApplication(app);
  });

  describe('webContents.isLoading()', function () {
    it('resolves to true', function () {
      return app.webContents.isLoading().should.eventually.be.true;
    });
  });

  describe('waitUntilWindowLoaded(timeout)', function () {
    it('rejects with an error when the timeout is hit', async function () {
      await expect(app.client.waitUntilWindowLoaded(100)).to.be.rejectedWith(
        Error
      );
    });
  });
});
