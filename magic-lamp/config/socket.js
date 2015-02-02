var socketio = require('socket.io');
var debug = require('debug')('magic-lamp-socket');
var Promise = require('bluebird');

module.exports = function(server) {

	var io = socketio.listen(server.server);

	//io.use(socketDeviceAuth);
	io.on('connection', onConnection);

	return io;
};


function onConnection(socket) {

	//debug('connected: \n  device: ' + socket.device + '\n  socket: ' + socket.id);

	socket.on('disconnect', onDisconnect);
	//

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

		findUser(data)
			.then(function(user) {

				data.userId = user.id;

				//debug('registered: ' + socket.id + ' app: ' + data.app + ' store: ' + data.storeId);
				debug('registered: ' + '\n    device: ' + data.deviceId + '\n    user:   ' + data.userId + '\n    socket: ' + socket.id + '\n    store:  ' + data.storeId);

				if (socket.info && socket.info.userId)
					socket.leave(socket.info.userId);

				socket.join(data.userId);

				// leave rooms from other stores
				var storeRooms = socket.rooms.splice();
				storeRooms.forEach(function(room) {
					if (room.startsWith('store-'))
						socket.leave(room);
				});

				socket.join('store-' + data.storeId);

				if (data.app) {
					socket.join(data.app);
					socket.join(data.app + ':' + data.storeId);
				}

				socket.info = data;
				socket.user = user;
			}).catch(function(ex) {
				debug('Registration Failed: ', ex);
				// TODO: Should send response back to client
			});
	});

	function onDisconnect(socket) {
		debug('disconnected');
	}

	function findUser(data) {
		User = User || require('mongoose').model('User');

		try {
			var query = buildUserQuery(data);

			return User.findOneAsync(query)
				.then(function(user) {
					if (!user)
						throw new Error('No user was found');
					return user;
				});
		} catch (ex) {
			return Promise.reject(ex);
		}
	}

	function buildUserQuery(data) {
		if (data.deviceId)
			return {
				device: data.deviceId
			};

		if (data.userId)
			return {
				_id: data.userId
			};

		throw new Error('Unable to create User query. Require either `data.deviceId` or `device.userId`');
	}
}

var User;

function socketDeviceAuth(socket, next) {

	// var mongoose = require('mongoose');
	// var User = mongoose.model('User');

	User = User || require('mongoose').model('User');

	var device = socket.request._query.device;

	debug('auth: ' + device);

	User.findOneAsync({
			device: device
		})
		.then(function(user) {

			if (!user)
				return next(new Error(ex));

			socket.user = user;
			socket.device = device;
			next();

		}).catch(function(ex) {
			next(new Error(ex));
		});
}