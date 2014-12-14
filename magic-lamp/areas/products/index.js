
var routeConfig = require('./routes');

module.exports = {
    init: function (app, config){
        
        var routes = routeConfig(config.passport);

        app.use('/products', routes);

    }
}