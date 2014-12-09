
var Promise = require('bluebird');
var express = require('express');
//var http = require('http');
//var io = require('socket.io')(http);
var cors = require('cors');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var debug = require('debug')('magic_lamp');

var socketConfig = require('./config/socket');
var mongoose = require('mongoose');
Promise.promisifyAll(mongoose);

mongoose.connect('mongodb://localhost/genie');

/*
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
...
server.listen(app.get('port')); // not 'app.listen'!
*/
//var ioHost = require('socket.io');

var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);


app.run = function (port, callback) {
        
    server.listen(port, callback);
    return server;
};

app.options('*', cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:49993");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'public')));

socketConfig(io);
//io.on('connection', function (socket) {
//    debug('generic socket connected');
//});

app.use('/', routes);
app.use('/users', users);

var products = require('./routes/products.js');
app.use('/products', products);



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
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
