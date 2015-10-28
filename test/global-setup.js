var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var path = require('path')

global.before(function () {
  chai.should()
  chai.use(chaiAsPromised)
})

exports.getElectronPath = function () {
  var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
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
