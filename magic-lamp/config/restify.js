var restify = require('restify');
var logger = require('morgan');


var server = restify.createServer();

restify.CORS.ALLOW_HEADERS.push('accept');
restify.CORS.ALLOW_HEADERS.push('sid');
restify.CORS.ALLOW_HEADERS.push('lang');
restify.CORS.ALLOW_HEADERS.push('origin');
restify.CORS.ALLOW_HEADERS.push('withcredentials');
restify.CORS.ALLOW_HEADERS.push('x-requested-with');
restify.CORS.ALLOW_HEADERS.push('authorization');

server.use(restify.CORS({
    credentials: true
}));

var log = function(text){
	return function(req, res, next){
		console.log(text);
		next();
	}
}

server.use(function(req, res, next){
	console.log('random');
	next();
});

server.use(logger('dev'));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser());
//server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(restify.conditionalRequest());

server.opts('/', function(req, res,next){
	next();
})

module.exports = server;
