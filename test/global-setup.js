const path = require('path');
const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiRoughly = require('chai-roughly');
const { Application } = require('..');

global.before(() => {
  chai.should();
  chai.use(chaiAsPromised);
  chai.use(chaiRoughly);
});

exports.getElectronPath = () => {
  let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
  if (process.platform === 'win32') electronPath += '.cmd';
  return electronPath;
};

exports.setupTimeout = (test) => {
  if (process.env.CI) {
    test.timeout(30000);
  } else {
    test.timeout(10000);
  }
};

exports.startApplication = async (options) => {
  const appOpts = { ...options, path: exports.getElectronPath() };
  if (process.env.CI) {
    appOpts.startTimeout = 30000;
  }

  const app = new Application(appOpts);
  await app.start();

  assert.strictEqual(app.isRunning(), true);
  chaiAsPromised.transferPromiseness = app.transferPromiseness;
  return app;
};

exports.stopApplication = async (app) => {
  if (!app || !app.isRunning()) {
    return;
  }

  await app.stop();
  assert.strictEqual(app.isRunning(), false);
};
