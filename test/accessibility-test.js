var helpers = require('./global-setup')
var path = require('path')
var expect = require('chai').expect

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

describe('app.client.auditAccessibility()', function () {
  helpers.setupTimeout(this)

  var app = null

  afterEach(function () {
    return helpers.stopApplication(app)
  })

  describe('when the audit passes', function () {
    beforeEach(function () {
      return helpers.startApplication({
        args: [path.join(__dirname, 'fixtures', 'accessible')]
      }).then(function (startedApp) { app = startedApp })
    })

    it('resolves to an audit object with no results', function () {
      return app.client.waitUntilWindowLoaded()
        .auditAccessibility().then(function (audit) {
          expect(audit.failed).to.be.false
          expect(audit.results).to.have.length(0)
          expect(audit.message).to.equal('Accessibilty audit passed')
        })
    })
  })

  describe('when the audit fails', function () {
    beforeEach(function () {
      return helpers.startApplication({
        args: [path.join(__dirname, 'fixtures', 'not-accessible')]
      }).then(function (startedApp) { app = startedApp })
    })

    it('resolves to an audit object with the results', function () {
      return app.client.waitUntilWindowLoaded()
        .auditAccessibility().then(function (audit) {
          expect(audit.failed).to.be.true
          expect(audit.results).to.have.length(3)

          expect(audit.results[0].code).to.equal('AX_TEXT_01')
          expect(audit.results[0].elements).to.deep.equal(['INPUT'])
          expect(audit.results[0].severity).to.equal('Severe')

          expect(audit.results[1].code).to.equal('AX_HTML_01')
          expect(audit.results[1].elements).to.deep.equal(['html'])
          expect(audit.results[1].severity).to.equal('Warning')

          expect(audit.results[2].code).to.equal('AX_COLOR_01')
          expect(audit.results[2].elements).to.deep.equal(['DIV'])
          expect(audit.results[2].severity).to.equal('Warning')
        })
        .windowByIndex(1)
        .auditAccessibility().then(function (audit) {
          expect(audit.failed).to.be.true
          expect(audit.results).to.have.length(1)

          expect(audit.results[0].code).to.equal('AX_ARIA_01')
          expect(audit.results[0].elements).to.deep.equal(['DIV'])
          expect(audit.results[0].severity).to.equal('Severe')
        })
    })

    it('ignores warnings when ignoreWarnings is specified', function () {
      return app.client.waitUntilWindowLoaded()
        .auditAccessibility({ignoreWarnings: true}).then(function (audit) {
          expect(audit.failed).to.be.true
          expect(audit.results).to.have.length(1)

          expect(audit.results[0].code).to.equal('AX_TEXT_01')
          expect(audit.results[0].elements).to.deep.equal(['INPUT'])
          expect(audit.results[0].severity).to.equal('Severe')
        })
    })

    it('ignores rules when ignoreRules is specified', function () {
      return app.client.waitUntilWindowLoaded()
        .auditAccessibility({ignoreRules: ['AX_TEXT_01', 'AX_HTML_01']}).then(function (audit) {
          expect(audit.failed).to.be.true
          expect(audit.results).to.have.length(1)

          expect(audit.results[0].code).to.equal('AX_COLOR_01')
          expect(audit.results[0].elements).to.deep.equal(['DIV'])
          expect(audit.results[0].severity).to.equal('Warning')
        })
    })
  })
})
