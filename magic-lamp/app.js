
// https://github.com/focusaurus/express_code_structure

var connections = require('./config/connections.js');
var passport = require('passport');
var fs = require('fs');

var app = connections.app;
var server = connections.server;

app.run = function (port, callback) {
        
    server.listen(port, callback);
    return server;
};

fs.readdirSync(__dirname + '/models').forEach(function (file) {
    if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

require('./config/passport.js')(passport);
require('./config/express.js')(app, passport);
require('./config/routes.js')(app, connections.io, passport);

module.exports = app;
