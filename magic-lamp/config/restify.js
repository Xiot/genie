﻿var restify = require('restify');
var logger = require('morgan');
var multer = require('multer');
var mongoose = require('mongoose');

var metrics = load('~/core/metrics');
var formatter = load('~/core/services/formatter');

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
restify.CORS.ALLOW_HEADERS.push('x-auth');

server.use(restify.CORS({
	credentials: true
}));

var log = function(text) {
	return function(req, res, next) {
		console.log(text);
		next();
	}
}

server.use(metrics.startCapture());
server.on('after', function(req, res, route, err){
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


server.use(function(req, res, next){

	req.protocol = (req.isSecure() ? 'https' : 'http');

	req.requestUrl = function(){
		return req.protocol + '://' + req.header('Host') + req.url;
	}

	req.link = function(name, params, query){
		var serverPath = req.protocol + '://' + req.header('Host');

		if(params) {
			for(var key in params) {
				let value = params[key];
				params[key] = getValueOrId(value);
				// if(value instanceof mongoose.Types.ObjectId) {
				// 	params[key] = value.toString();
				// } else if(typeof value === 'object') {
				// 	params[key] = value && (value._id || value.id);
				// }
			}
		}

		var relativePath = server.router.render(name, params, query);
		if(!relativePath)
			return undefined;

		return serverPath + relativePath;
	};

	//console.log(req.requestUrl());
	next();
});

function getValueOrId(value){
	if(!value)
		return value;

	if(typeof value !== 'object')
		return value;

	if(value instanceof mongoose.Types.ObjectId)
		return value.toString();

	return value._id || value.id || value;
}


var router = load('~/core/routes/index.es6');
router(server);

server.get(/loaderio-c7e2eb31d553b6100da33fb876222607/, restify.serveStatic({
	directory: './static'
}));

module.exports = server;

// Should move formatter into here.
function formatJSON(req, res, body, cb) {
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

	var formattedData = formatter.format(body, req);

	// to make the formatter async, return `this` and use the `cb` to pass the value back;
	if(isPromise(formattedData)){

		formattedData.then(function(x){
			var data = JSON.stringify(formattedData);
			res.setHeader('Content-Length', Buffer.byteLength(data));
			cb(data);
		})
		.catch(function(ex){
			ch(ex);
		});
		return this;
	}

	var data = JSON.stringify(formattedData);
	res.setHeader('Content-Length', Buffer.byteLength(data));


	return (data);
}

function isPromise(obj) {
   return obj && typeof(obj) === 'object' && obj.then !== undefined;
}
