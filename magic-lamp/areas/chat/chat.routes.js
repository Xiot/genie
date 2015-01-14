var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');

var errors = load('~/core/errors');
var chatService = require('./chat.service');

module.exports = function(server, io, passport) {

	server.get('/chat', function(req, res, next) {
		ChatLog.findAsync()
			.then(function(results) {

				var obj = results.toObject();
				obj.forEach(function(c){
					c.messages.forEach(function(m){
						m.sent = m.user == req.user.id;
					});
				});

				res.send(obj);
				next();

			}).catch(function(ex) {
				next(new errors.ServerError(ex));
			});
	});

	server.post('/chat', function(req, res, next) {
		var newChat = new ChatLog();
		newChat.saveAsync()
			.spread(function(s) {			

				res.send(s);
				next();

			}).catch(function(ex) {
				next(new Error(ex));
			});
	});

	server.get('/chat/:id', function(req, res, next) {
		
try{
		ChatLog.findById(req.params.id)
			.populate('participants')
			.execAsync()
			.then(function(chat) {

				var obj = chat.toObject();
				obj.messages.forEach(function(m){
					m.sent = m.user == req.user.id;
				});

				res.send(obj);
				next();

			}).catch(function(ex) {
				next(new Error(ex));
			});
		} catch(ex){
			next(new Error(ex));
		}
	})

	server.post('/chat/:id/messages', passport.authenticate(['bearer', 'device']), function(req, res, next) {

		var message = {
			message: req.body.message,
			user: req.user.id,
			time: Date.now()
		};

		var room = chatService.getById(req.params.id);

		return room.post(message)
		.then(function(){
			res.send(message);
			next();

		}).catch(function(ex){
			console.log(ex.message);
			console.log(ex.stack);
			next(new Error(ex));
			
		});

	});

};