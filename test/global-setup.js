const Application = require('..').Application
const assert = require('assert')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiRoughly = require('chai-roughly')

const path = require('path')

global.before(() => {
  chai.should()
  chai.use(chaiAsPromised)
  chai.use(chaiRoughly)
})

exports.getElectronPath = () => {
  let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
  if (process.platform === 'win32') electronPath += '.cmd'
  return electronPath
}

exports.setupTimeout = function (test) {
  if (process.env.CI) {
    test.timeout(30000)
  } else {
    test.timeout(10000)
  }
}

exports.startApplication = (options) => {
  options.path = exports.getElectronPath()
  if (process.env.CI) options.startTimeout = 30000

  const app = new Application(options)
  return app.start().then(() => {
    assert.strictEqual(app.isRunning(), true)
    chaiAsPromised.transferPromiseness = app.transferPromiseness
    return app
  })
}

exports.stopApplication = (app) => {
  if (!app || !app.isRunning()) return

  return app.stop().then(() => {
    assert.strictEqual(app.isRunning(), false)
  })
}
