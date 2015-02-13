var restify = require('restify');
var logger = require('morgan');
var multer = require('multer');
var mongoose = require('mongoose');

var router = load('~/core/routes');

var metrics = load('~/core/metrics');

var server = restify.createServer({
	formatters: {
		'application/json': formatJSON
	}
});

var errorLog = require('debug')('magic-lamp-error');

restify.CORS.ALLOW_HEADERS.push('accept');
restify.CORS.ALLOW_HEADERS.push('sid');
restify.CORS.ALLOW_HEADERS.push('lang');
restify.CORS.ALLOW_HEADERS.push('origin');
restify.CORS.ALLOW_HEADERS.push('withcredentials');
restify.CORS.ALLOW_HEADERS.push('x-requested-with');
restify.CORS.ALLOW_HEADERS.push('authorization');
restify.CORS.ALLOW_HEADERS.push('x-device');

server.use(restify.CORS({
	credentials: true
}));

var log = function(text) {
	return function(req, res, next) {
		console.log(text);
		next();
	}
}

// server.use(function(req, res, next){
// 	console.log('random');
// 	next();
// });

server.use(metrics.startCapture());
server.on('after', function(req, res, route, err){
	console.log('after-request: ' + req.method + ' ' + req.url);
	metrics.endCapture(req, res, route, err);
});


server.use(logger('dev'));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser());
//server.use(restify.gzipResponse());
server.use(restify.bodyParser({
	uploadDir: './.tmp/',
	keepExtensions: true,
	mapParams: false
}));
server.use(restify.conditionalRequest());


router(server);

module.exports = server;

function formatJSON(req, res, body) {
	if (body instanceof Error) {
		// snoop for RestError or HttpError, but don't rely on
		// instanceof

		errorLog('error', body);
		errorLog(body.stack);

		if (body instanceof mongoose.Error.ValidationError) {
			res.statusCode = 400;
		} else {

			res.statusCode = body.statusCode || 500;
		}

		if (body.body) {
			body = body.body;
		} else {

			if (body.statusCode)
				delete body.statusCode
				// body = {
				//     message: body.message
				// };
		}
	} else if (Buffer.isBuffer(body)) {
		body = body.toString('base64');
	}

	var data = JSON.stringify(body);
	res.setHeader('Content-Length', Buffer.byteLength(data));

	return (data);
}