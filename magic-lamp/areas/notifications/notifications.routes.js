var mongoose = require('mongoose');
var Notification = mongoose.model('Notification');

module.exports = function(server) {

	var route = server.route('/notifications');

	route
		.get('/', 'Notifications.All', function(req, res, next) {

			var query = {};
			if(req.params.user_id)
				query.user = req.params.user_id;			

			Notification.find(query)
				.order('-created')
				.populate('user')
				.limit(10)
				.execAsync()
				.then(function(list){
					res.send(list);
					next();
				}).catch(function(ex){
					next(new Error(ex));
				});
		})
		.patch('/', function(req, res, next){

			//TODO: Enable mass mark-read of notifications.
			// Can also mark by a key
			next();
		})
		.param('notification_id', function(req, res, next, value) {

			Notification.findByIdAsync(value)
			.then(function(data){
				req.notification = data;
				next();
			}).catch(function(ex){
				next(new Error(ex));
			});
		})
		.get('/:notification_id', 'Notification.Detail', function(req, res,next){
			next(req.notification);
			next();
		});

	return route;
}