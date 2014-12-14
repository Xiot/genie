

var routes = require('./chat.routes');
var socketConfig = require('./chat.socket.js');

module.exports = {
    init: initialize
};

function initialize(app, config) {
    app.use('/chat', routes);

    socketConfig(config.io);

}