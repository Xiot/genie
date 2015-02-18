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

// Need to build a pub-sub model that is compatible with socket.io-redis using mongoDB.
//   http://tugdualgrall.blogspot.fr/2015/01/how-to-create-pubsub-application-with.html
//   https://github.com/Automattic/socket.io-redis/blob/master/index.js
//   https://devcenter.heroku.com/articles/realtime-polyglot-app-node-ruby-mongodb-socketio

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

	socket.leaveAllRooms = function() {

		this.rooms.forEach(function(room) {
			if (room != socket.id)
				socket.leave(room);
		});
	}

	socket.on('register', function(data) {

		socket.leaveAllRooms();

		findUser(data)
			.then(function(user) {

				data.userId = user.id;

				//debug('registered: ' + socket.id + ' app: ' + data.app + ' store: ' + data.storeId);	

				socket.join(data.userId);
				socket.join('store:' + data.storeId);

				if (data.app) {
					socket.join(data.app);
					socket.join(data.app + ':' + data.storeId);
				}

				if (user.isEmployee) {
					socket.join('store:' + data.storeId + ':employee');

					if (user.departments)
						user.departments.forEach(function(dept) {
							socket.join('department:' + dept);
						});
				}

				socket.info = data;
				socket.user = user;

				debug('registered: ' 
					+ '\n    device: ' + data.deviceId 
					+ '\n    user:   ' + data.userId 
					+ '\n    socket: ' + socket.id 
					+ '\n    store:  ' + data.storeId 
					+ '\n    app:    ' + data.app);

				// setTimeout(function(){
				// 	var roomList = socket.rooms.join(', ');
				// 	console.log(socket.id + ':> ' + roomList);
				// }, 2000);

			}).catch(function(ex) {
				debug('Registration Failed: ', ex.stack);
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

					if (user)
						return user;

					if (data.app !== 'qarin')
						throw new Error('No user was found');

					user = new User({
						device: data.deviceId,
						role: 'device'
					});
					return user.saveAsync();

				});
		} catch (ex) {
			return Promise.reject(ex);
		}
	}

	function buildUserQuery(data) {

		var query = {
			active: true
		};

		if (data.userId) {
			query._id = data.userId;
			return query;
		}

		if (data.deviceId) {
			query.device = data.deviceId;
			return query;
		}

		throw new Error('[' + data.app + '] Unable to create User query. Require either `deviceId` or `userId`');
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