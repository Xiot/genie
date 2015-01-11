var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');

var chatService = load('~/areas/chat/chat.service');
var debug = require('debug')('magic-lamp-chat-controller');

module.exports = function(server, io, passport) {

	server.get('/', function(req, res, next) {

		var query = {
			store: req.params.store_id,
		};

		ChatLog.findAsync(query)
			.then(function(results) {

				var list = [];
				
				results.forEach(function(c) {
					var obj = c.toObject();
					obj.messages.forEach(function(m) {
						m.sent = m.user == req.user.id;
					});
					list.push(obj);
				});
				res.send(list);

				next();
			}).catch(function(ex) {
				debug(ex);
				next(new Error(ex));
			});
	});

	server.post('/', passport.authenticate('bearer'), function(req, res, next) {

		try {
			var newChat = new ChatLog();
			newChat.store = req.params.store_id;
			newChat.participants.push(req.user.id);

			newChat.saveAsync()
				.spread(function(s) {
					res.send(s);
					next();
				}).catch(function(ex) {
					next(new Error(ex));
				});
		} catch (ex) {
			next(new Error(ex));
		}
	});

	server.route('/:chat_id')
		.get('/', function(req, res, next) {
			debug('chat-get');
			ChatLog.findByIdAsync(req.params.chat_id)
				.then(function(chat) {

					res.send(chat);
					next();

				}).catch(function(ex) {
					next(ex);
				});
		})
		.post('/messages', passport.authenticate('bearer'), function(req, res, next) {
			debug('chat-message-post');

			var message = {
				message: req.body.message,
				user: req.user.id,
				timestamp: Date.now()
			};

			var room = chatService.getById(req.params.chat_id);

			return room.post(message)
				.then(function() {
					res.send(204, 'OK');

				}).catch(function(ex) {
					next(new Error(ex));

				});

		});
}