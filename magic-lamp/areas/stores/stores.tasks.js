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

var ticketService = load('~/core/services/ticket.service');
var employeeService = load('~/core/services/employee.service');

module.exports = function(server, passport, io) {

	var route = server.route('/tasks')

	.get('', function(req, res, next) {

			Task.find({
					store: req.store.id
				})
				.populate('product')
				.populate('department')
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
					});
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
					.populate('department')
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

						if (task.product && !task.department) {
							return Product.findByIdAsync(task.product)
								.then(function(product) {
									task.department = product.department;
									return task;
								});
						}
						return task;
					}).then(function(newTask) {
						return newTask.saveAsync();
					})
					.spread(function(newTask) {

						var channel = io.to('aladdin:' + req.store.id);

						if (newTask.department)
							channel = channel.to('department:' + newTask.department);

						channel.emit('ticket:created', newTask);

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

		var task = req.task;

		var employee = req.body.employee || req.user.id;
		var status = req.body.status;

		if (!status)
			return new restify.BadRequestError('status is required.');

		var now = Date.now();
		var oldStatus = task.status;

		task.status = status;

		if (status === 'assigned') {
			task.assigned_to = employee;

		} else if (status === 'complete') {
			task.complete = true;

		}

		// TODO: Create a user service that will set the current status, and send the notification
		var savedTask = null;
		return task.saveAsync()
			.spread(function(task) {
				savedTask = task;

				if(status === 'assigned'){
					return employeeService.setStatus(employee, 'busy').then(function(){
						return savedTask;
					});
				} else if(status === 'complete'){
					return employeeService.setStatus(employee, 'available')
					.then(function(){
						return savedTask;
					})
				}

				return savedTask;
			});
	}))

	.put('/assignee', wrap(function(req) {

		var employeeId = req.body.employee;
		var task = req.task;

		if (task.assigned_to)
			return new restify.PreconditionFailedError('The task was already assigned');

		return ticketService
			.assignTicket(employeeId, task)

		// task.assigned_to = employee;
		// task.status = 'assigned';

		// // send notification to user
		// // this should only have minimum info
		// console.log('io.to: ' + task.customer);
		// io.to(task.customer).emit('task:assigned', {
		// 	employee: employee,
		// 	task: task
		// });

		// var employeeTask = Promise.resolve();

		// if(employee.status === 'available'){
		// 	employee.status == 'busy';
		// 	employeeTask = employee.saveAsync()
		// 		.then(function(e){
		// 			io.to('store:' + employee.store + ':employee')
		// 			.emit('employee:status', {employee: employee});
		// 		});
		// }

		// return employeeTask
		// .then(function(){
		// 	return task.saveAsync();	
		// });
	}));
}