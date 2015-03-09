var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');
var Product = mongoose.model('Product');
var restify = require('restify');

var errors = load('~/core/errors');
var chatService = require('./chat.service');

var formatter = load('~/core/services/formatter');

formatter.handle(ChatLog, function(obj, req) {

    var value = obj.toObject();

    value.id = obj.id;
    delete value._id;
    delete value.__v;

    if(obj.product && obj.product instanceof Product) {
    	value.product = formatter.format(obj.product, req);
    }

	//var obj = chat.toObject();
	obj.messages.forEach(function(m){
		m.sent = m.user == req.user.id;
	});

    return value;

});
module.exports = function(server, io, passport) {

	server.get('/', function(req, res, next) {
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

	server.post('/', function(req, res, next) {
		var newChat = new ChatLog();
		newChat.saveAsync()
			.spread(function(s) {

				res.send(s);
				next();

			}).catch(function(ex) {
				next(new Error(ex));
			});
	});

	server.get('/:chat_id', function(req) {

		return ChatLog.findById(req.params.chat_id)
			.populate('participants product')
			.execAsync()
			.then(function(chat) {

				if(!chat)
                    return new restify.NotFoundError();

				return chat;

			});
	})

	server.post('/:chat_id/messages', function(req, res, next) {

		var message = {
			message: req.body.message,
			user: req.user.id,
			time: Date.now()
		};

		var room = chatService.getById(req.params.chat_id);

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
