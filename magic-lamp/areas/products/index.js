
var routeConfig = require('./routes');

module.exports = {
    init: function (server, config){
        
        routeConfig(server, config.passport);

        //app.use('/products', routes);

    }
}