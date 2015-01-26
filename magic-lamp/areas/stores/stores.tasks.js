var mongoose = require('mongoose');
var Task = mongoose.model('Task');
var wrap = load("~/core/routes/promiseRouter");

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
		//passport.authenticate('bearer'),
		wrap(function(req) {

			var body = null;

			var task = new Task(req.body);
			task.store = req.store;
			task.created_by = req.user;

			return task.saveAsync()
				.spread(function(ret) {
					return ret;
				});
		}));

	var taskRoute = route.route('/:task_id')
}