﻿
var routes = require('./chat.routes.js');

module.exports = {
    init: initialize
};

function initialize(server, config) {
    //server.use('/chat', routes);
    routes(server.route('/chat'), config.io, config.passport);
}