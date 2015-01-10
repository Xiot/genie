var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');

var errors = load('~/core/errors');
var chatService = require('./chat.service');

module.exports = function(server, io) {

	server.get('/chat', function(req, res, next) {
		ChatLog.findAsync()
			.then(function(results) {

				res.send(results);
				next();

			}).catch(function(ex) {
				next(new errors.ServerError(ex));
			});
	});

	server.post('/chat', function(req, res, next) {
		var newChat = new ChatLog();
		newChat.saveAsync()
			.then(function(s) {

				res.send(s);
				next();

			}).catch(function(ex) {
				next(new Error(ex));
			});
	});

	server.get('/chat/:id', function(req, res, next) {
		ChatLog.findByIdAsync(req.params.id)
			.then(function(chat) {

				res.send(chat);
				next();

			}).catch(function(ex) {
				next(ex);
			})
	})

	server.post('/chat/:id/messages', function(req, res, next) {

		var message = {
			message: req.body.message,
			user: req.user.id,
			timestamp: Date.now()
		};

		var room = chatService.getById(req.params.id);

		return room.post(message)
		.then(function(){
			res.send(204, 'OK');

		}).catch(function(ex){
			next(new Error(ex));
			
		});

	});

};