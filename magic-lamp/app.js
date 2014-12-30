
// https://github.com/focusaurus/express_code_structure

var connections = require('./config/connections.js');
var passport = require('passport');
var socketio = require('./config/socket');

var fs = require('fs');

//var app = connections.app;
//var server = connections.server;

var server = require('./config/restify');
var io = socketio(server);

//app.run = function (port, callback) {
        
//    server.listen(port, callback);
//    return server;
//};

fs.readdirSync(__dirname + '/models').forEach(function (file) {
    if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

require('./config/passport.js')(passport);
//require('./config/express.js')(app, passport);
require('./config/routes.js')(server, io, passport);

module.exports.run = function (port, callback) {
    server.listen(port, callback);
    return server;
};
