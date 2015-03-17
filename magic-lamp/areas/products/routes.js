//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');

var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');
var fs = require('fs');
var wrap = load("~/core/routes/promiseRouter");
var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');

var formatter = load('~/core/services/formatter');

var SearchLog = mongoose.model('SearchLog');
var RequestMetric = mongoose.model('RequestMetric');
var Product = mongoose.model('Product');
//var Product = load('~/models/Product');

//Promise.promisify(mongoose.Aggregate);

var upload = load('~/core/services/image.upload');

formatter.handle(Product, function(product, req) {

	var obj = product.toObject();

	delete obj._id;
	delete obj.__v;

	var href = req.link('product-detail', {
		store_id: product.store, //req.store.id,
		product_id: product.id
	});

	obj.id = product.id;

	obj._links = {
		self: href,
		store: req.link('stores-id', {
			store_id: product.store//req.store.id
		})
	};

	if (obj.image) {
		obj.imageUrl = req.link('get-image', {
			image_id: obj.image
		});
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
	.get('/recent-searches', async function(req){

		var lastWeek = new Date();
		lastWeek.setDate(lastWeek.getDate() - 28);

		var query = SearchLog.aggregate()
			.match({
				'store': req.store._id,
				timestamp: {$gt: lastWeek}
			})
			.group({
				_id: {text: '$searchText', day: {$dayOfYear: '$timestamp'}, year: {$year: '$timestamp'}},
				//day: {$dayOfYear: '$startTime'},
				//year: {$year: '$startTime'},
				count: {$sum: 1},
				date: {$min: '$timestamp'}
			})
			.sort({'_id.text': 1, '_id.day': 1, '_id.year': 1})
			.group({
				_id: '$_id.text',
				count: {$sum: '$count'},
				items: {$push: {
					day: '$_id.day',
					year: '$_id.year',
					date: '$date',
					count: '$count'
				}}
			})
			.sort({count: -1})
			.limit(5)
			.project({
				_id: 0,
				search: '$_id',
				count: '$count',
				items: '$items'
			});

		var results = await query.exec();

		results.forEach(function(stat){
			stat.items.forEach(function(item){
				item.date = moment.utc(item.data).startOf('day').toDate();
			});
		});
		return results;

		// return SearchLog.aggregate()
		// 	.match({
		// 		store: req.store._id,
		// 		timestamp: { $gt: lastWeek}
		// 	})
		// 	.group({
		// 		_id: '$searchText',
		// 		times: {$push: '$timestamp'},
		// 		count: {$sum: 1}
		// 	})
		// 	.sort({count: 1})
		// 	.exec();

		// return SearchLog.find()
		// .where({store: req.store.id})
		// .limit(200)
		// .sort({timestamp: 1})
		// .lean()
		// .select('timestamp searchText')
		// .execAsync();


	})
	.get('/stats/search', 'product_stats_search',
		async function(req) {

			var lastWeek = new Date();
			lastWeek.setDate(lastWeek.getDate() - 28);


			var query = RequestMetric.aggregate()
				.match({
					'params.store_id': req.store.id,
					'params.search': {
						$ne: null
					},
					routeName: 'productsall',
					startTime: {$gt: lastWeek}
				})
				.group({
					_id: {q: '$params.search', day: {$dayOfYear: '$startTime'}, year: {$year: '$startTime'}},
					//day: {$dayOfYear: '$startTime'},
					//year: {$year: '$startTime'},
					count: {$sum: 1},
					date: {$min: '$startTime'}
				})
				.sort({'_id.q': 1, '_id.day': 1, '_id.year': 1})
				.group({
					_id: '$_id.q',
					count: {$sum: '$count'},
					items: {$push: {
						day: '$_id.day',
						year: '$_id.year',
						date: '$date',
						count: '$count'
					}}
				})
				.sort({count: -1})
				.limit(5)
				.project({
					_id: 0,
					search: '$_id',
					count: '$count',
					items: '$items'
				});

			var q = await query.exec();

			var r = await query
				.unwind('items')
				.group({
					_id: {day: '$items.day', year: '$items.year'},
					date: {$min: '$items.date'},
					values: {$push: {
						search: '$search',
						count: '$items.count'
					}}
				})
				.sort({'_id.year': 1, '_id.day': 1})
				.exec();


			// var q = await RequestMetric.aggregate()
			// 	.match({
			// 		'params.store_id': req.store.id,
			// 		'params.search': {
			// 			$ne: null
			// 		},
			// 		routeName: 'productsall'
			// 	})
			// 	.group({
			// 		_id: '$params.search',
			// 		count: {
			// 			$sum: 1
			// 		}
			// 		// ,
			// 		// items: {
			// 		// 	$push: {
			// 		// 		day: {
			// 		// 			$dayOfYear: '$startTime'
			// 		// 		},
			// 		// 		year: {
			// 		// 			$year: '$startTime'
			// 		// 		}
			// 		// 	}
			// 		// }
			// 	})
			// 	.sort({
			// 		count: -1
			// 	})
			// 	.limit(5)
			// 	.project({
			// 		_id: 0,
			// 		search: '$_id',
			// 		count: '$count',
			// 		items: '$items'
			// 	})
			// 	.exec();

			return {q,r};

		})

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
				searchText: req.query.search,
				department: req.query.department
			});

			log.saveAsync();
		}

		if(req.query.department)
			query.department = req.query.department;

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

			var images = await upload(req, {
				metadata: {
					store: req.store.id
				}
			});

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

				if(!p)
					return next(new errors.NotFound('product not found.'));

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
