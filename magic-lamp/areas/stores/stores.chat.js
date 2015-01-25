var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');

var chatService = load('~/areas/chat/chat.service');
var debug = require('debug')('magic-lamp-chat-controller');

module.exports = function(server, io, passport) {

	server.get('/', function(req, res, next) {

		var query = {
			store: req.params.store_id,
		};

		ChatLog.find(query, {
				lastMessageTime: 1,
				participants: 1,
				closed: 1,
				product: 1,
				messages: {
					$slice: -1
				},
				startTime: 1,
				store: 1
			})
			.sort({
				lastMessageTime: -1
			})
			.execAsync()
			.then(function(results) {

				var list = results.map(function(c) {
					var value = c.toObject();
					value.lastMessage = value.messages[0];
					delete value.messages;
					return value;
				});


				res.send(list);

				next();
			}).catch(function(ex) {
				debug(ex);
				next(new Error(ex));
			});
	});

	server.post('/',
		function(req, res, next) {
			if (!req.authenticated)
				return next(new Error('unauthenticated'));
			next();
		},
		function(req, res, next) {

			try {
				var opts = {
					store: req.params.store_id,
					//product: req.body.product,
					user: req.user.id
				};
				if(req.body && req.body.product)
					opts.product = req.body.product;


				chatService.create(opts)
					.then(function(chat) {
						res.send(chat);
						next();
					}).catch(function(ex) {
						next(new Error(ex));
					})
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