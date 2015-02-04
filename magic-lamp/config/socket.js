var socketio = require('socket.io');
var debug = require('debug')('magic-lamp-socket');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function(server) {

	var io = socketio.listen(server.server);

	//io.use(socketDeviceAuth);
	io.on('connection', onConnection);

	return io;
};


function onConnection(socket) {

	//debug('connected: \n  device: ' + socket.device + '\n  socket: ' + socket.id);

	socket.on('disconnect', onDisconnect);
	
	socket.on('join', function(opts) {
		var id = opts.id;
		debug('chat-join: ', opts);
		socket.join('chat-' + id);
	});

	socket.on('leave', function(opts) {
		debug('chat-leave: ' + id);
		socket.leave('chat-' + opts.id);
	});

	socket.leaveAllRooms = function(){

		this.rooms.forEach(function(room){
			if(room != socket.id)
				socket.leave(room);
		});
	}

	socket.on('register', function(data) {

		socket.leaveAllRooms();

		findUser(data)
			.then(function(user) {

				data.userId = user.id;

				//debug('registered: ' + socket.id + ' app: ' + data.app + ' store: ' + data.storeId);
				debug('registered: ' 
					+ '\n    device: ' + data.deviceId 
					+ '\n    user:   ' + data.userId 
					+ '\n    socket: ' + socket.id 
					+ '\n    store:  ' + data.storeId 
					+ '\n    app:    ' + data.app);			

				socket.join(data.userId);
				socket.join('store:' + data.storeId);

				if (data.app) {
					socket.join(data.app);
					socket.join(data.app + ':' + data.storeId);
				}

				user.departments.forEach(function (dept) {
					socket.join('department:' + dept.id);
				});
				
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

		throw new Error('[' + data.app +  '] Unable to create User query. Require either `data.deviceId` or `device.userId`');
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