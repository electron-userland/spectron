var helpers = require('./global-setup')
var path = require('path')
var expect = require('chai').expect

var describe = global.describe
var it = global.it
var before = global.before
var after = global.after

describe('app.client.performAccessibilityAudit()', function () {
  helpers.setupTimeout(this)

  var app = null

  before(function () {
    return helpers.startApplication({
      args: [path.join(__dirname, 'fixtures', 'accessibility')]
    }).then(function (startedApp) { app = startedApp })
  })

  after(function () {
    return helpers.stopApplication(app)
  })

  it('results to an audit object with the results', function () {
    return app.client.waitUntilWindowLoaded()
      .performAccessibilityAudit().then(function (audit) {
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
      .performAccessibilityAudit().then(function (audit) {
        expect(audit.failed).to.be.true
        expect(audit.results).to.have.length(1)

        expect(audit.results[0].code).to.equal('AX_ARIA_01')
        expect(audit.results[0].elements).to.deep.equal(['DIV'])
        expect(audit.results[0].severity).to.equal('Severe')
      })
  })
})
