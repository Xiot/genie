

var modules = {};

module.exports = {
    register: register,
    initialize: initialize
};

function register(name, config){
    modules[name] = config;
};

function initialize(app){

};