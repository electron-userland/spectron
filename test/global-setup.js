var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

global.before(function () {
  this.timeout(10000)

  chai.should()
  chai.use(chaiAsPromised)
})
