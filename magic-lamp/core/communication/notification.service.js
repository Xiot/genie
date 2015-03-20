
/*
var debug = require('debug')('magic-lamp-socket');

function NotificationService(io){

	this._io = io;
	this.send = sendMessage;

	init();

	function init(){
		this._io.on('connection', onConnection);
	}

	function sendMessage(target, message, data){

		if(!Array.isArray)
			target = [target];

		var group = this._io;
		for(var i = 0; i < target.length; i++)
			group = group.to(target[i]);

		return group.emit(message, data);
	}

	function onConnection(socket) {

		debug('connected: \n  device: ' + socket.device + '\n  user: ' + socket.user.id + '\n  socket: ' + socket.id);

		socket.on('disconnect', onDisconnect);
		socket.join(socket.user.id);

		socket.on('join', function(opts) {
			var id = opts.id;
			debug('chat-join: ', opts);
			socket.join('chat-' + id);
		});

		socket.on('leave', function(opts) {
			debug('chat-leave: ' + id);
			socket.leave('chat-' + opts.id);
		});

		socket.on('register', function(data) {
			var userId = data.userId;
			var storeId = data.storeId;
			var deviceId = data.deviceId;

			debug('registered: ' + socket.id + ' app: ' + data.app + ' store: ' + data.storeId);

			// leave rooms from other stores
			var storeRooms = socket.rooms.splice();
			storeRooms.forEach(function(room) {
				if (room.startsWith('store-'))
					socket.leave(room);
			});

			socket.join('store-' + storeId);

			if(data.app){
				socket.join(data.app);
				sockat.join(data.app + ':' + storeId);
			}
		});

		function onDisconnect(socket) {
			debug('disconnected');
		}

	}

}

module.exports = NotificationSerive;
*/
