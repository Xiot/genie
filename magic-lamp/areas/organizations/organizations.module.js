var routeBuilder = require('./organizations.routes');

module.exports = {
    init: function (app, config) {
        var routes = routeBuilder(config.passport);
        app.use('/organizations', routes);
    }
}