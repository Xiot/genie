var mongoose = require('mongoose');
var restify = require('restify');
var Task = mongoose.model('Task');
var Chat = mongoose.model('ChatLog');

var wrap = load("~/core/routes/promiseRouter");
var patch = require('fast-json-patch');


module.exports = function(server, passport, io) {

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
		.get('/open', wrap(function(req) {

			var query = {
				store: req.store.id,
				complete: false
			};

			if (req.params.employee) {
				query.assigned_to = {
					$in: [req.params.employee, null]
				}
			}

			return Task.find(query)
				.sort({
					created_at: -1
				})
				.execAsync();
		}))
		.post('/',
			wrap(function(req) {

				var task = new Task(req.body);
				task.store = req.store;
				task.created_by = req.user;

				if (task.isRequest) {
					task.customer = req.user;
				}

				var chat = new Chat({
					store: req.store,
					product: task.product
				});
				chat.participants.push(req.user);

				return chat.saveAsync()
					.spread(function(savedChat) {

						task.chat = savedChat;
						return task.saveAsync();
					}).spread(function(newTask) {

						io.to('aladdin:' + req.store.id)
							.emit('ticket:created', newTask);

						return newTask;
					});
			}));

	var taskRoute = route.route('/:task_id')
		.param('task_id', function(req, res, next, value) {

			Task.findByIdAsync(req.params.task_id)
				.then(function(task) {

					if (!task)
						return next(new restify.NotFoundError());

					req.task = task;
					next();
				}).catch(function(ex) {
					return next(new restify.InternalServerError(ex));
				});
		})

	.get('/', wrap(function(req) {

		if (!req.task)
			return new restify.NotFoundError();

		return req.task;
	}))

	.patch('/', wrap(function(req) {

		var task = req.task;
		var retVal = patch.apply(task, req.body);

		if (!retVal) {
			return new restify.PreconditionFailedError();
		}

		if (task.isModified('assigned_to'))
			return new restify.BadRequestError('To assign the task use PUT ' + req.url + '/assignee');

		return task.saveAsync();
	}))

	.put('/assignee', wrap(function(req) {

		var employee = req.body.employee;
		var task = req.task;

		if (req.assigned_to)
			return new restify.PreconditionFailedError('The task was already assigned');

		task.assigned_to = employee;


		// send notification to user
		// this should only have minimum info
		console.log('io.to: ' + task.customer);
		io.to(task.customer).emit('task:assigned', {
			employee: employee,
			task: task
		});

		return task.saveAsync();

	}));
}