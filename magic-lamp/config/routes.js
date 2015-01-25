var area = require('../areas');
var debug = require('debug')('magic-lamp-error');
var mongoose = require('mongoose');
var errorHandler = require('express-error-handler');

module.exports = function(server, io, passport) {

    area.init(server, {
        io: io,
        passport: passport
    });

    // catch 404 and forward to error handler
    // server.use(function (req, res, next) {
    //     var err = new Error('Not Found');
    //     err.statusCode = 404;
    //     next(err);
    // });

    var handleError = errorHandler({
        server: server,
        framework: 'restify'
    });
    var handleProcessError = errorHandler({
        server: server
    });

// server.on('after', function(req, res, route, err){
//     debug('after: ',route, err);
// });

    //server.use(handler);
    server.on('uncaughtException', function(req, res, route, err) {
        debug('server uncaught. ', err.message);
        debug(' stack: ', err.stack);
        
        handleError(req, res, route, err);
    });

    process.on('uncaughtException', function(err) {
        debug('process.uncaught', err);
        handleProcessError(err);
    });



    // error handlers

    // development error handler
    // will print stacktrace

    //if (app.get('env') === 'development') {
    // server.use(function (err, req, res, next) {

    //     debug('message: ' + err.message);
    //     debug('stack: ' + err.stack);


    //     if (typeof err === 'string') {
    //         res.status(500);
    //         res.send({ message: err });
    //     } else {

    //         if (err instanceof mongoose.Document.ValidationError) {
    //             res.status(400);
    //             res.send(err);
    //         } else {
    //             res.status(err.statusCode || 500);
    //             res.send({
    //                 message: err.message,
    //                 stackTrace: err.stack,
    //             });
    //         }


    //     }

    // });
    //}

    // production error handler
    // no stacktraces leaked to user
    // server.use(function (err, req, res, next) {
    //     debug(err);
    //     res.status(err.status || 500);
    //     res.render('error', {
    //         message: err.message,
    //         error: {}
    //     });
    // });

}
