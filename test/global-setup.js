var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

global.before(function () {
  chai.should()
  chai.use(chaiAsPromised)
})
