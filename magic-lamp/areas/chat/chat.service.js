var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');


var service = {
	create: createNewChat,
	init: initialize
}

function createNewChat() {
	return new ChatRoom();
}

function ChatRoom() {

	this.id = null;

}

function ChatService() {

	var _io;

	this.init = function(io) {
		_io = io;
		_io.on('connection', onConnection);
	}

	this.getById = function(id) {

	}

	function onConnection(socket) {

		socket.on('disconnect', onDisconnect);

		socket.on('join', function(opts) {
			var id = opts.id;
			socket.join(id);
		});

		socket.on('leave', function(opts) {
			socket.leave(opts.id);
		});

		socket.on('register', function(data){
			var userId = data.userId;
			var storeId = data.storeId;

			// leave rooms from other stores
			var storeRooms = socket.rooms.splice();
			storeRooms.forEach(function(room){
				if(room.startsWith('store-'))
					socket.leave(room);
			});

			socket.join('store-' + storeId);
			socket.join('user-' + userId);
		});

		socket.on('message', function(data){
			var chatId = data.chatId;
			
			_io.to(chatId).emit('message', {
				from: socket.data.name,
				date: Date.now(),
				message: data.message
			}
		});
	}

	function onDisconnect(socket) {

	}

}

var s = new ChatService();

module.exports = s;