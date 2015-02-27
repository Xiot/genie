var mongoose = require('mongoose');
var wrap = load("~/core/routes/promiseRouter");
var User = mongoose.model('User');
var patch = require('fast-json-patch');
var restify = require('restify');
var employeeService = load('~/core/services/employee.service');

module.exports = function(server, io) {

	server.get('/', wrap(function(req) {

		var includeDeleted = req.query.includeInactive === 'true';

		var department = req.query.department;
		var onlyAvailable = req.query.available == true;

		var query = {
			store: req.store.id,
			role: 'employee'
		};

		if (!includeDeleted) {
			query.active = true;
		};

		if (department){
			query.department = department
		};

		if(onlyAvailable)
			query.status = 'available';

		return User.findAsync(query);
	}));

	server.post('/', 'employees.add', wrap(function(req) {

		var user = new User(req.body);
		user.store = req.store.id;
		user.role = 'employee';
		user.auth.stores.push(req.store);
		user.auth.orgs.push(req.store.organization);

		return user.saveAsync()
			.spread(function(saved) {
				return saved;
			});
	}));

	server.get('available', wrap(function(req) {

	}))

	server.route('/:user_id')
		.param('user_id', function(req, res, next, value) {

			var query = {
				store: req.store.id,
				role: 'employee'
			};

			if(mongoose.Types.ObjectId.isValid(value)){
				query._id = value;
			} else {
				query.username = value;
			}

			User.findOneAsync(query)
				.then(function(user) {

					if (!user)
						return next(new restify.NotFoundError('Not Found'));

					req.employee = user;
					next();

				}).catch(function(ex) {
					next(ex);
				});
		})
		.get('/', wrap(function(req) {
			return req.employee;
		}))
		.put('/status', wrap(function(req) {

			return employeeService
				.setStatus(req.employee, req.body.status);

			// var employee = req.employee;

			// employee.status = req.body.status;

			// return employee.saveAsync()
			// 	.spread(function(emp) {
			// 		io.to('store:' + employee.store + ':employee')
			// 			.emit('employee:status', {
			// 				employee: employee
			// 			});
			// 		return emp;
			// 	});

		}))
		.patch('/', wrap(function(req) {

			if (!req.body)
				return Promise.reject(new restify.BadRequestError('Body required.'));

			patch.apply(req.employee, req.body);

			return req.employee.saveAsync();

		}))
		.del('/', wrap(function(req) {
			return req.employee.updateAsync({
					active: false
				})
				.spread(function(updated) {
					return updated;
				});
		}));

}