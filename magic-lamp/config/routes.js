var area = require('../areas');
var debug = require('debug')('magic-lamp-error');

module.exports = function (app, io, passport){
    
    area.init(app, { io: io, passport: passport });
    
    
    
    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.statusCode = 404;
        next(err);
    });
    
    // error handlers
    
    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            debug(err);
            res.status(err.statusCode || 500);
            res.send({
                message: err.message,
                stackTrace: err.stack,
            });
        });
    }
    
    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        debug(err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

}