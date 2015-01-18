//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var Product = load('~/models/Product');
var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');
var fs = require('fs');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(null);
	}
	next();
	//res.redirect('/error')
}

module.exports = function(server, passport) {

	server.route('/products')

	.get('/', 'productsall', function(req, res, next) {

		try {
			debug('search: ' + req.query.search);

			var query = {};
			if (req.store)
				query.store = req.store.id;

			if (req.query.search)
				query.$text = {
					$search: req.query.search
				};

			Product.find(query)
				.sort({_id: 1})
				.execAsync()
				.then(function(products) {

					var list = products.map(function(p) {
						var obj = p.toObject();
						if (obj.image)
							obj.imageUrl = "http://localhost:3000/images/" + obj.image;
						return obj;
					})

					res.send(list);
					next();
				}).catch(function(ex) {
					next(new Error(ex));
				});

		} catch (ex) {
			next(new Error(ex));
		}
	})

	.post('/', 'products-new', function(req, res, next) {
		debug('products-new');

		try {
			debug('body', req.body);
			//debug('files', req.files);

			var img = req.files && req.files.image;
			//debug('img', img);

			var s = fs.createReadStream(img.path);
			var opts = {
				filename: img.name,
				content_type: img.type || 'binary/octet-stream',
				mode: 'w',
				metadata: {
					store: req.store.id
				}
			};

			var imageSave = mongoose.files.put(opts, s);
			// var imageSave = req.pipe(mongoose.files.gfs.createWriteStream({filename: 'test'}))
			// res.send('ok');
			// next();

			imageSave.then(function(file) {
				debug('image saved', file);

				var p = new Product(req.body);
				p.store = req.store;
				p.image = file.id || file._id;

				p.saveAsync()
					.spread(function(w) {

						var obj = w.toObject();
						obj.imageUrl = '/images/' + file._id;

						res.send(obj);
						next();
					}).catch(function(e) {
						next(new errors.ServerError(e));
					});
			}).catch(function(ex) {
				next(new Error(ex));
			});

		} catch (ex) {
			next(new Error(ex));
		}
	})

	.param('product_id', function(req, res, next, value) {


		return Product.findByIdAsync(req.params.product_id)
			.then(function(p) {

				if (p.store != req.store.id) {
					return next(new errors.NotFound('no product. wrong store'));
				}

				req.product = p;
				next();

			}).catch(function(err) {
				console.log(err);
				next(new errors.NotFound('no product'));
			});
	})

	.get('/:product_id', 'product-detail', function(req, res, next) {

		var obj = req.product.toObject();
		if (obj.image)
			obj.imageUrl = "/images/" + obj.image;

		res.send(obj);
		next();
	});
};
//module.exports = router;