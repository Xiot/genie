//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');

var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');
var fs = require('fs');
var wrap = load("~/core/routes/promiseRouter");
var Promise = require('bluebird');
var _ = require('lodash');

var formatter = load('~/core/services/formatter');

var SearchLog = mongoose.model('SearchLog');
var RequestMetric = mongoose.model('RequestMetric');
var Product = mongoose.model('Product');
//var Product = load('~/models/Product');

var upload = load('~/core/services/image.upload');

formatter.handle(Product, function(product, req) {

	var obj = product.toObject();

	delete obj._id;
	delete obj.__v;

	var href = req.link('product-detail', {store_id: req.store.id, product_id: product.id});
	obj.id = product.id;

	obj._links = {
		self: href,
		store: req.link('stores-id', {store_id: req.store.id})
	};

	if (obj.image) {
		obj.imageUrl = req.link('get-image', {image_id: obj.image});
		obj._links.image = obj.imageUrl;
	}
	return obj;

});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(null);
	}
	next();
	//res.redirect('/error')
}

module.exports = function(server, passport) {

	server.route('/products')

	// TODO: Move stats to its own module
	.get('/stats/search', 'product_stats_search', wrap(function(req) {

		return new Promise(function(resolve, reject) {

			RequestMetric.aggregate()
				.match({
					'params.store_id': req.store.id,
					routeName: 'productsall'
				})
				.group({
					_id: '$params.search',
					count: {
						$sum: 1
					}
				})
				.sort({
					count: -1
				})
				.project({
					_id: 0,
					search: '$_id',
					count: '$count'
				})
				.exec(function(err, ret) {
					if (err)
						return reject(err);

					resolve(ret);
				});
		});
	}))

	.get('/stats/product-details', 'product_stats_details', wrap(function(req) {

		return new Promise(function(resolve, reject) {

			RequestMetric.aggregate()
				.match({
					'params.store_id': req.store.id,
					routeName: 'productdetail'
				})
				.group({
					_id: '$params.product_id',
					count: {
						$sum: 1
					}
				})
				.sort({
					count: -1
				})
				.limit(5)
				.exec(function(err, ret) {
					if (err)
						return reject(err);

					var productIds = ret.map(function(value) {
						return value._id
					});

					Product.findAsync({
							_id: {
								$in: productIds
							}
						})
						.then(function(products) {

							products.forEach(function(product) {
								var item = _.find(ret, function(r) {
									return r._id == product.id
								});
								if (item) {
									item.product = product;
								}
							});
							resolve(ret);
						})
						.catch(function(ex) {
							reject(ex);
						});
				});
		});
	}))

	.get('/', 'productsall', wrap(function(req) {


		debug('search: ' + req.query.search);

		var query = {};
		if (req.store)
			query.store = req.store.id;

		if (req.query.search) {
			query.$text = {
				$search: req.query.search
			};

			var log = new SearchLog({
				store: req.store,
				user: req.user,
				searchText: req.query.search
			});

			log.saveAsync();
		}

		return Product.find(query)
			.sort({
				_id: 1
			})
			.execAsync()
			.then(function(products) {

				return products;				
			});
	}))

	.post('/', 'products-new', async function(req) {
		
		var images = await upload(req, {metadata: {store: req.store.id}});

		var p = new Product(req.body);
		p.store = req.store;
		p.image = images[0];

		p.images = images.slice(1);

		await p.saveAsync();

		return p;

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

	.get('/:product_id', 'product-detail', wrap(function(req) {
		return req.product;		
	}));
};
//module.exports = router;