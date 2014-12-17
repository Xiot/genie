
var routeConfig = require('./users.routes.js');

module.exports.init = function (app, config) {
    
    app.use('/users', routeConfig(config.passport));

};