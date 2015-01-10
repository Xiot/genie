

var routes = require('./chat.routes.js');
var socketConfig = require('./chat.socket.js');

module.exports = {
    init: initialize
};

function initialize(server, config) {
    //server.use('/chat', routes);
    routes(server, config.io);
    socketConfig(config.io);

}