var mongoose = require('mongoose');
var restify = require('restify');
var Task = mongoose.model('Task');
var Chat = mongoose.model('ChatLog');
var Product = mongoose.model('Product');
var Department = mongoose.model('Department');

var _ = require('lodash');
var wrap = load("~/core/routes/promiseRouter");
var patch = require('fast-json-patch');
var Promise = require('bluebird');

module.exports = function(server, passport, io) {

	var route = server.route('/tasks')

	.get('', function(req, res, next) {

			Task.find({
					store: req.store.id
				})
				.populate('product', 'product.department')
				.sort({
					created_at: -1
				})
				.execAsync()
				.then(function(tasks) {
					res.send(tasks);

				}).catch(function(ex) {
					return next(new ServerError(ex));
				})
		})
		.get('/open',
			wrap(function(req) {
				var employeeId = req.params.employee;
				if (!employeeId)
					return null;

				if (employeeId === 'me' || employeeId === req.user.id) {
					req.employee = req.user;
					return null;
				}

				return User.findByIdAsync(employeeId)
					.then(function(employee) {
						req.employee = employee;
						return null;
					})

			}),
			wrap(function(req) {

				var query = {
					store: req.store.id,
					complete: false
				};

				if (req.employee) {
					query.assigned_to = {
						$in: [req.employee._id, null]
					}

					var departmentList = req.employee.departments;
					departmentList.push(null);

					query.department = {
						$in: departmentList
					}
				}
				console.log(query);

				return Task.find(query)
					.populate('product')
					.sort({
						created_at: -1
					})
					.execAsync()
					.then(function(tasks) {
						return Department.populateAsync(tasks, 'product.department');
					});
			}))
		.get('/stats', wrap(function(req) {
			// http://lostechies.com/derickbailey/2013/10/28/group-by-count-with-mongodb-and-mongoosejs/

			return new Promise(function(resolve, reject) {
				Task.aggregate()
					.match({
						store: req.store._id
					})
					.group({
						_id: '$status',
						count: {
							$sum: 1
						}
					})
					.project('count')
					.exec(function(err, ret) {

						console.log('err', err);
						console.log('ret', ret);

						if (err)
							return reject(err);

						var stats = ret.map(function(s) {
							return {
								status: s._id,
								count: s.count
							};
						});

						return resolve(stats);
					});
			});

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
		.put('/status', wrap(function(req) {
			return null;
		}))
		.put('/assignee', wrap(function(req) {

			var employee = req.body.employee;
			var task = req.task;

			if (req.assigned_to)
				return new restify.PreconditionFailedError('The task was already assigned');

			task.assigned_to = employee;
			task.status = 'assigned';

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