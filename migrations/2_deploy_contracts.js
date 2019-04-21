// var Football = artifacts.require("Football");
var Football = artifacts.require("./Football.sol");

module.exports = function (deployer) {
    deployer.deploy(Football);
    // deployer.deploy(Adoption);
};