var mongoose = require('mongoose');
var bluebird = require('bluebird');
var Token = mongoose.model('Token');

//var store = module.exports;

function TokenStore(){

    var tokens = {};

}

TokenStore.prototype.create = function (user){

}

function CachedToken(){

};

module.exports = new TokenStore();