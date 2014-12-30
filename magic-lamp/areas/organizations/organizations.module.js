var routeBuilder = require('./organizations.routes');

module.exports = {
    init: function (server, config) {
        routeBuilder(server, config.passport);
        //app.use('/organizations', routes);
    }
}