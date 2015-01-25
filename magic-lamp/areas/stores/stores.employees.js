var mongoose = require('mongoose');
var wrap = load("~/core/routes/promiseRouter");
var User = mongoose.model('User');
var patch = require('fast-json-patch');
var restify = require('restify');

module.exports = function(server) {

	server.get('/', wrap(function(req) {

		var includeDeleted = req.query.includeInactive === 'true';

		var query = {
			store: req.store.id,
			role: 'employee'
		};

		if (!includeDeleted) {
			query.active = true;
		};

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


	server.route('/:user_id')
		.param('user_id', function(req, res, next, value) {

			User.findOneAsync({
					store: req.store.id,
					username: value,
					role: 'employee'
				})
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