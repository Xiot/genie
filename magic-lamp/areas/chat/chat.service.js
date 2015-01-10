var mongoose = require('mongoose');
var ChatLog = mongoose.model('ChatLog');

var debug = require('debug')('magic-lamp-chat');

/*
Notes
----------------

static service
get(user)
 - gets the local service for the user.
 - 

Take in io + user.
this should be a transient service

methods
.create()
.join(id, user)
.leave(id, user)
.get(id)
.reply(id, message)

when a message is added to a convo, the notificaiton is sent out
 to everyone in the socket.io room.

users are added to the room when they connect and when they have
 active chat sessions.

*/


var s = new ChatService();

module.exports = s;

function createNewChat() {
	return new ChatRoom();
}

function ChatRoom(id, io) {

	this.id = null;

	this.post = function(msg) {

		return ChatLog.updateAsync({
				_id: id
			}, {
				$push: {
					messages: msg
				},
				$addToSet: {
					participants: msg.user.id
				}
			})
			.spread(function(affected) {

				if (affected === 0)
					throw new Error('room not found');

				io.to(id).emit('message', {
					from: msg.user.id,
					date: msg.timestamp,
					message: msg.message
				});

				return true;
			});
	}
}

function ChatService() {

	var _io;

	var _openRooms = {};

	this.init = function(io) {
		_io = io;
		_io.on('connection', onConnection);
	}

	this.getById = function(id) {

		var room = _openRooms[id];
		if(room)
			return room;

		room = _openRooms[id] = new ChatRoom(id, _io);
		return room;
	}

	function onConnection(socket) {

		debug('chat connected')

		socket.on('disconnect', onDisconnect);

		socket.on('join', function(opts) {
			var id = opts.id;
			socket.join('chat-' + id);
		});

		socket.on('leave', function(opts) {
			socket.leave('chat-' + opts.id);
		});

		socket.on('register', function(data) {
			var userId = data.userId;
			var storeId = data.storeId;

			// leave rooms from other stores
			var storeRooms = socket.rooms.splice();
			storeRooms.forEach(function(room) {
				if (room.startsWith('store-'))
					socket.leave(room);
			});

			socket.join('store-' + storeId);
			socket.join('user-' + userId);
		});

		// socket.on('message', function(data) {
		// 		var chatId = data.chatId;

		// 		_io.to(chatId).emit('message', {
		// 				from: socket.data.name,
		// 				date: Date.now(),
		// 				message: data.message
		// 			}
		// 		});
		// }

		function onDisconnect(socket) {
			debug('disconnected');
		}

	}
};