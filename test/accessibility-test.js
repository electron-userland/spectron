const helpers = require('./global-setup');
const path = require('path');
const { expect } = require('chai');
const assert = require('assert');

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe('app.client.auditAccessibility()', function () {
  helpers.setupTimeout(this);

  let app = null;

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  describe('when the audit passes', function () {
    beforeEach(function () {
      return helpers
        .startApplication({
          args: [path.join(__dirname, 'fixtures', 'accessible')]
        })
        .then(function (startedApp) {
          app = startedApp;
        });
    });

    it('resolves to an audit object with no results', async function () {
      await app.client.waitUntilWindowLoaded();
      const audit = await app.client.auditAccessibility();
      assert.strictEqual(audit.failed, false);
      expect(audit.results).to.have.length(0);
      expect(audit.message).to.equal('Accessibilty audit passed');
    });
  });

  describe('when the audit fails', function () {
    beforeEach(function () {
      return helpers
        .startApplication({
          args: [path.join(__dirname, 'fixtures', 'not-accessible')]
        })
        .then(function (startedApp) {
          app = startedApp;
        });
    });

    it('resolves to an audit object with the results', async function () {
      await app.client.waitUntilWindowLoaded();
      await app.client.windowByIndex(0);
      let audit = await app.client.auditAccessibility();
      assert.strictEqual(audit.failed, true);
      expect(audit.results).to.have.length(3);

      expect(audit.results[0].code).to.equal('AX_TEXT_01');
      expect(audit.results[0].elements).to.deep.equal(['INPUT']);
      expect(audit.results[0].severity).to.equal('Severe');

      expect(audit.results[1].code).to.equal('AX_HTML_01');
      expect(audit.results[1].elements).to.deep.equal(['html']);
      expect(audit.results[1].severity).to.equal('Warning');

      expect(audit.results[2].code).to.equal('AX_COLOR_01');
      expect(audit.results[2].elements).to.deep.equal(['DIV']);
      expect(audit.results[2].severity).to.equal('Warning');
      await app.client.windowByIndex(1);
      audit = await app.client.auditAccessibility();
      assert.strictEqual(audit.failed, true);
      expect(audit.results).to.have.length(1);

      expect(audit.results[0].code).to.equal('AX_ARIA_01');
      expect(audit.results[0].elements).to.deep.equal(['DIV']);
      expect(audit.results[0].severity).to.equal('Severe');
    });

    it('ignores warnings when ignoreWarnings is specified', async function () {
      await app.client.waitUntilWindowLoaded();
      const audit = await app.client.auditAccessibility({
        ignoreWarnings: true
      });
      assert.strictEqual(audit.failed, true);
      expect(audit.results).to.have.length(1);

      expect(audit.results[0].code).to.equal('AX_TEXT_01');
      expect(audit.results[0].elements).to.deep.equal(['INPUT']);
      expect(audit.results[0].severity).to.equal('Severe');
    });

    it('ignores rules when ignoreRules is specified', async function () {
      await app.client.waitUntilWindowLoaded();
      const audit = await app.client.auditAccessibility({
        ignoreRules: ['AX_TEXT_01', 'AX_HTML_01']
      });
      assert.strictEqual(audit.failed, true);
      expect(audit.results).to.have.length(1);

      expect(audit.results[0].code).to.equal('AX_COLOR_01');
      expect(audit.results[0].elements).to.deep.equal(['DIV']);
      expect(audit.results[0].severity).to.equal('Warning');
    });
  });
});
