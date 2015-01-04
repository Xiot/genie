var mongoose = require('mongoose');
//var router = require('express').Router();
//var storeRoutes = require('express').Router();

var passport = require('passport');

var errors = load('~/core/errors');
var NotFound = errors.NotFound;
var ServerError = errors.ServerError;

var Store = mongoose.model('OrganizationLocation');
var Product = mongoose.model('Product');
var Task = mongoose.model('Task');
var User = mongoose.model('User');

var debug = require('debug')('magic-lamp-stores');

module.exports.init = function(server, config) {

	server.get('/stores', function(req, res, next) {
		Store.find()
			.populate('organization')
			.execAsync()
			.then(function(x) {
				res.send(x);
				next();
			}).catch(function(ex) {
				next(ex);
			});
	});

	server.get({
		name: 'store.get',
		path: '/stores/:store_id'
	}, storeMiddleware, function(req, res) {
		res.send(req.store);
	});

	server.get('/stores/:store_id/products', storeMiddleware, function(req, res, next) {

		Product.findAsync({
				store: req.store.id
			})
			.then(function(products) {
				res.send(products);
			}).catch(function(ex) {
				next(new ServerError(ex));
			});
	});

	server.get('/stores/:store_id/tasks', storeMiddleware, function(req, res, next) {

		Task.findAsync({
				store: req.store.id
			})
			.then(function(tasks) {
				res.send(tasks);

			}).catch(function(ex) {
				return next(new ServerError(ex));
			})
	});

	server.post('/stores/:store_id/tasks',
		storeMiddleware,
		passport.authenticate('bearer'),
		function(req, res, next) {
			
			var body = null;

			try {
				body = req.body;
			} catch (ex) {
				next(ex);
			}

			try {
				var task = new Task(body);
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

	server.get('/stores/:store_id/employees',
		storeMiddleware,
		function(req, res, next) {

			try {
				User.findAsync({
					store: req.store.id
				}).
				then(function(x) {
					res.send(x);
					next();
				}).catch(function(ex) {
					next(ex);
				});
			} catch (ex) {
				next(ex);
			}
		}
	);

	server.post('/stores/:store_id/employees',
		storeMiddleware,
		function(req, res, next) {

			var employee = new User(req.body);
			employee.store = req.store;
			if (!employee.role)
				employee.role = 'employee';

			if (employee.role = 'store_admin') {
				if (!employee.auth) {
					employee.auth = new {
						stores: [],
						orgs: []
					}
				}
				employee.auth.stores.push(req.store);
				employee.auth.orgs.push(req.store.organization)
			}

			employee.saveAsync()
				.spread(function(user) {
					res.send(user);
					next();
				}).catch(function(ex) {
					next(ex);
				});

		});
}

//function 

function storeMiddleware(req, res, next) {
	var storeId = req.params.store_id;

	if (storeId === 'undefined')
		next(new Error('StoreId not found.'));

	if (!mongoose.Types.ObjectId.isValid(storeId))
		return next(new NotFound('The store can not be found.'));

	Store.findByIdAsync(storeId)
		.then(function(store) {
			if (!store)
				return next(new NotFound('The store can not be found'));

			req.store = store;
			next();
		}).catch(function(ex) {
			next(new NotFound('The store can not be found'));
		});
}