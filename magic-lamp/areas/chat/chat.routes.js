var ChatLog = require('./models/ChatLog');
//var router = require('express').Router();
var errors = load('~/core/errors');

module.exports = function(server) {

	server.get('/chat', function(req, res, next) {
		ChatLog.findAsync()
			.then(function(results) {

				res.send(results);

			}).catch(function(ex) {
				next(new errors.ServerError(ex));
			});
	});
};