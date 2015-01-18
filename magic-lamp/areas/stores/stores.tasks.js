
var mongoose = require('mongoose');
var Task = mongoose.model('Task');

module.exports = function(server, passport) {

	var route = server.route('/tasks')

	.get('/', function(req, res, next) {

		Task.findAsync({
				store: req.store.id
			})
			.then(function(tasks) {
				res.send(tasks);

			}).catch(function(ex) {
				return next(new ServerError(ex));
			})
	})

	.post('/',
		passport.authenticate('bearer'),
		function(req, res, next) {

			var body = null;

			try {
				var task = new Task(req.body);
				task.store = req.store;
				task.created_by = req.user;

				task.saveAsync()
					.spread(function(ret) {
						res.send(ret);
						next();

					}).catch(function(ex) {
						next(ex);
					});
			} catch (ex) {
				throw ex;
			}
		});

	var taskRoute = route.route('/:task_id')
}