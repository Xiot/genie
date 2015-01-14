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
var ChatLog = mongoose.model('ChatLog');
var Product = mongoose.model('Product');

var debug = require('debug')('magic-lamp-stores');
var multer = require('multer');

var productRoutes = load('~/areas/products/routes');

module.exports.init = function(server, config) {

	var route = server.route('/stores')

	.get('/', 'stores-all', function(req, res, next) {
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

	var storeRoute = route.route('/:store_id')
		.param('store_id', storeMiddleware);



	productRoutes(storeRoute, config.passport);
	require('./stores.tasks')(storeRoute, config.passport);

	require('./stores.chat')(storeRoute.route('/chat'), config.io, config.passport);

	// TODO: Extract to new file
	storeRoute.get('/products',
		storeMiddleware,
		function(req, res, next) {

			debug('search: ' + req.query.search);

			var query = {
				store: req.store.id
			};
			if (req.query.search)
				query.$text = {
					$search: req.query.search
				};

			Product.findAsync(query)
				.then(function(products) {
					res.send(products);
					next();
				}).catch(function(ex) {
					next(new Error(ex));
				});
		});

	// server.get('/stores/:store_id/employees',
	// 	storeMiddleware,
	// 	function(req, res, next) {

	// 		try {
	// 			User.findAsync({
	// 				store: req.store.id
	// 			}).
	// 			then(function(x) {
	// 				res.send(x);
	// 				next();
	// 			}).catch(function(ex) {
	// 				next(ex);
	// 			});
	// 		} catch (ex) {
	// 			next(ex);
	// 		}
	// 	}
	// );

	// server.post('/stores/:store_id/employees',
	// 	storeMiddleware,
	// 	function(req, res, next) {

	// 		var employee = new User(req.body);
	// 		employee.store = req.store;
	// 		if (!employee.role)
	// 			employee.role = 'employee';

	// 		if (employee.role = 'store_admin') {
	// 			if (!employee.auth) {
	// 				employee.auth = new {
	// 					stores: [],
	// 					orgs: []
	// 				}
	// 			}
	// 			employee.auth.stores.push(req.store);
	// 			employee.auth.orgs.push(req.store.organization)
	// 		}

	// 		employee.saveAsync()
	// 			.spread(function(user) {
	// 				res.send(user);
	// 				next();
	// 			}).catch(function(ex) {
	// 				next(ex);
	// 			});

	// 	});

	// server.get('/stores/:store_id/chatlogs',
	// 	storeMiddleware,
	// 	function(req, res, next) {

	// 		ChatLog.findAsync({
	// 				store: req.store.id
	// 			})
	// 			.then(function(chats) {
	// 				res.send(chats);
	// 				next();
	// 			}).catch(function(ex) {
	// 				next(new Error(ex));
	// 			});
	// 	});



	// //server.use(multer(multerOptions ));

	// server.post('stores/:store_id/products',
	// 	storeMiddleware,
	// 	// function(req, res, next) {
	// 	// 	debug('multer-start');

	// 	// 	var multerOptions = {
	// 	// 		dest: './tmp/',
	// 	// 		rename: function(field, filename) {
	// 	// 			return filename + Date.now();
	// 	// 		},
	// 	// 		onFileUploadStart: function(file) {
	// 	// 			console.log(file.originalname + ' is starting ...');
	// 	// 		},
	// 	// 		onFileUploadComplete: function(file) {
	// 	// 			console.log(file.fieldname + ' uploaded to ' + file.path);
	// 	// 			req.file = file;
	// 	// 			next();
	// 	// 		},
	// 	// 		onError: function(err, next) {
	// 	// 			console.log('Error: ' + err);
	// 	// 			next(error);
	// 	// 		}
	// 	// 	};
	// 	// 	try {
	// 	// 		multer(multerOptions)(req,res,next);
	// 	// 	} catch (ex) {
	// 	// 		console.log('me: ' + ex);
	// 	// 		next(ex);
	// 	// 	}
	// 	// },

	// 	function(req, res, next) {
	// 		console.log('after upload');
	// 		try {
	// 			//			var p = new Product(req.body);
	// 			console.log(req.files);
	// 			//console.log(req.files[0]);
	// 			console.log(req.body);
	// 			res.send(204);
	// 			next();
	// 		} catch (ex) {
	// 			next(ex);
	// 		}
	// 	});
}

//function 


function storeMiddleware(req, res, next, value) {
	var storeId = value || req.params.store_id;

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