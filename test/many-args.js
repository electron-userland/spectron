const helpers = require('./global-setup');
const path = require('path');
const temp = require('temp').track();

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;
const expect = require('chai').expect;

describe('application loading', function () {
  helpers.setupTimeout(this);

  let app = null;
  let tempPath = null;

  beforeEach(function () {
    tempPath = temp.mkdirSync('spectron-temp-dir-');

    return helpers
      .startApplication({
        cwd: path.join(__dirname, 'fixtures'),
        args: [
          path.join(__dirname, 'fixtures', 'app'),
          '--bar1=baz1',
          '--bar2=baz2',
          '--bar3=baz3',
          '--bar4=baz4',
          '--bar5=baz5',
          '--bar6=baz6',
          '--bar7=baz7',
          '--bar8=baz8',
          '--bar9=baz9',
          '--bar10=baz10',
          '--bar11=baz11',
          '--bar12=baz12',
          '--bar13=baz13',
        ],
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

  it('passes through args to the launched app', async function () {
    const argv = await app.mainProcess.argv();
    expect(argv[2]).to.equal('--bar1=baz1');
    expect(argv[9]).to.equal('--bar8=baz8');
    expect(argv[12]).to.equal('--bar11=baz11');
  });
});
