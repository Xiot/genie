var socketio = require('socket.io');



module.exports = function (server) {

    var io = socketio.listen(server.server);

    io.use(socketDeviceAuth);

    return io;
};

var User;
function socketDeviceAuth(socket, next){

	// var mongoose = require('mongoose');
	// var User = mongoose.model('User');

	User = User || require('mongoose').model('User');

	var device = socket.request._query.device;
	
	User.findOneAsync({device: device})
	.then(function(user){

		if(!user)
			return next(new Error(ex));

		socket.user = user;
		socket.device = device;
		next();

	}).catch(function(ex){
		next(new Error(ex));
	});
}