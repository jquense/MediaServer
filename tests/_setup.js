var chai = require('chai')
  , chaiAsPromised = require('chai-as-promised')

module.exports = function(){
    chai.use(chaiAsPromised);
    chai.should();
}