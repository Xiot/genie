var fs = require('fs');

// https://github.com/focusaurus/express_code_structure

fs.readdirSync(__dirname + '/models').forEach(function (file) {
    if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

var connections = require('./config/connections.js');
var passport = require('passport');
var socketio = require('./config/socket');



//var app = connections.app;
//var server = connections.server;

var server = require('./config/restify');
var io = socketio(server);

//app.run = function (port, callback) {
        
//    server.listen(port, callback);
//    return server;
//};



require('./config/passport.js')(server, passport);
//require('./config/express.js')(app, passport);
require('./config/routes.js')(server, io, passport);

require('./areas/chat/chat.service').init(io);

module.exports.run = function (port, callback) {
    server.listen(port, callback);
    return server;
};
