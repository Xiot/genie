
var routeConfig = require('./users.routes.js');

module.exports.init = function (server, config) {
    
    routeConfig(server, config.passport);

};