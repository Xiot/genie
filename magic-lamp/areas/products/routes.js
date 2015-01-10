//var express = require('express');
//var router = express.Router();
var Product = load('~/models/Product');
var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(null);
	}
	next();
	//res.redirect('/error')
}

module.exports = function(server, passport) {

	server.route('/products')
		// .param('product_id', function(req, res, next, value) {
		//           debug('id handler');

	// 	return Product.findByIdAsync(req.params.product_id)
	// 		.then(function(p) {
	// 			//res.send(p);
	// 			req.product = p;
	// 			next();

	// 		}).catch(function(err) {
	// 			next(new errors.NotFound('no product'));
	// 		});
	// })
	.use(function(req, res, next) {
		debug('route: ', req.route);
        next();
	})

	.get('/', 'productsall', function(req, res, next) {

		try {
			debug('get-all');

			Product.find(function(err, p) {
				if (!err) {
					res.send(p);
					next();
				} else {
					console.log('err: ' + err);
					next(new Error(err));
				}
			});

		} catch (ex) {
			next(new Error(ex));
		}
	})

	.post('/', 'products-new', function(req, res, next) {
		var p = new Product(req.body);
		p.saveAsync()
			.spread(function(w) {
				res.send(w);
				next();
			}).catch(function(e) {
				next(new errors.ServerError(e));
			});
	})

	.get('/:product_id', 'product-detail', function(req, res, next) {
		res.send(req.product);
		next();
	});

	// /* GET users listing. */
	server.get({path: '/products', name: 'products-all-get'}, 
	   // passport.authenticate([  'bearer']), 
	    //passport.authenticate('localapikey'),

	    function (req, res, next) {

	    debug(req.user);

	    Product.find(function (err, p) {
	        if (!err) {
	            res.send(p);
	            next();
	        } else {
	            console.log('err: ' + err);
	            next(err);
	        }
	    });
	});

	// server.get('/products//:id', function (req, res, next) {
	//     Product.findByIdAsync(req.params.id)
	//     .then(function (p) {
	//         res.send(p);
	//          next();
	//     }).catch(function (err) {
	//         next(new errors.NotFound('no product'));
	//     });
	// });

	// server.post('/products', function (req, res, next) {
	//     var p = new Product(req.body);
	//     p.saveAsync()
	//     .spread(function (w) {
	//         res.send(w);
	//         next();
	//     }).catch(function (e) {
	//         next(new errors.ServerError(e));
	//     });
	// });
	//return server;
};
//module.exports = router;