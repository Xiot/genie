var fs = require('fs');

// https://github.com/focusaurus/express_code_structure

fs.readdirSync(__dirname + '/models').forEach(function (file) {
    if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

var connections = require('./config/connections.js');
var passport = require('passport');
var socketio = require('./config/socket');

var server = require('./config/restify');
var io = socketio(server);

//var notification = new require('./core/communication/notification.service')(io);

require('./core/services/employee.service').init(io);
require('./core/services/ticket.service').init(io);

require('./config/passport.js')(server, passport);
//require('./config/express.js')(app, passport);
require('./config/routes.js')(server, io, passport);

require('./areas/chat/chat.service').init(io);

var mongoAdapter = load('~/core/communication/MongoAdapter');
io.adapter(mongoAdapter(connections.mongoose));

module.exports.run = function (port, callback) {
    server.listen(port, callback);
    return server;
};
