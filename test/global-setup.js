var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

before(function () {
  chai.should()
  chai.use(chaiAsPromised)
})
