var mongoose = require('mongoose');
var restify = require('restify');
var Task = mongoose.model('Task');
var wrap = load("~/core/routes/promiseRouter");
var patch = require('fast-json-patch');


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
	.get('/open', wrap(function(req){
		
		var query = {
			store: req.store.id,
			complete: false
		};

		if(req.params.employee) {
			query.assigned_to = {$in: [req.params.employee, null]}
		}

		console.log(query);

		return Task.find(query)
		.sort({created_at: -1})
		.execAsync();
	}))
	.post('/',
		//passport.authenticate('bearer'),
		wrap(function(req) {

			var body = null;

			var task = new Task(req.body);
			task.store = req.store;
			task.created_by = req.user;

			if(task.type === 'request'){
				task.customer = req.user;
			}

			return task.saveAsync()
				.spread(function(ret) {
					return ret;
				});
		}));

	var taskRoute = route.route('/:task_id')
	.param('task_id', function(req, res, next, value){
		Task.findByIdAsync(req.params.task_id)
		.then(function(task){
			if(!task)
				return next(new restify.NotFoundError());

			req.task = task;
			next();
		}).catch(function(ex){
			return next(new restify.InternalServerError(ex));
		});
	})
	.get('/', wrap(function(req){
		return req.task;
	}))
	.patch('/', wrap(function(req){

		var task = req.task;
		var retVal = patch.apply(task, req.body);

		if(!retVal){
			return new restify.PreconditionFailedError();
		}

		console.log(retVal);
		

		return task.saveAsync();

	}));
}