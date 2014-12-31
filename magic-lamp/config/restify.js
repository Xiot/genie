var restify = require('restify');
var logger = require('morgan');

var server = restify.createServer();


server.use(restify.CORS());
server.use(logger('dev'));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser());
//server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(restify.conditionalRequest());

module.exports = server;