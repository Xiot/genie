//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var Product = load('~/models/Product');
var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');
var fs = require('fs');
var wrap = load("~/core/routes/promiseRouter");
var Promise = require('bluebird');
var _ = require('lodash');

var SearchLog = mongoose.model('SearchLog');
var RequestMetric = mongoose.model('RequestMetric');

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next(null);
	}
	next();
	//res.redirect('/error')
}

module.exports = function(server, passport) {

	server.route('/products')

	.get('/stats/search', 'product_stats_search', wrap(function(req){

		return new Promise(function(resolve, reject){

			RequestMetric.aggregate()
				.match({
					'params.store_id': req.store.id,
					routeName: 'productsall'
				})
				.group({
					_id: '$params.search',
					count: {$sum: 1}
				})
				.sort({count: -1})
				.project({
					_id: 0,
					search: '$_id',
					count: '$count'
				})
				.exec(function(err, ret){
					if(err)
						return reject(err);
					
					resolve(ret);
				});
		});
	}))

	.get('/stats/product-details', 'product_stats_details', wrap(function(req){

		return new Promise(function(resolve, reject){

			RequestMetric.aggregate()
				.match({
					'params.store_id': req.store.id,
					routeName: 'productdetail'
				})
				.group({
					_id: '$params.product_id',
					count: {$sum: 1}
				})
				.sort({count: -1})
				.limit(5)
				.exec(function(err, ret){
					if(err)
						return reject(err);

					var productIds = ret.map(function(value){return value._id});

					Product.findAsync({_id: {$in: productIds}})
					.then(function(products){

						products.forEach(function(product){
							var item = _.find(ret, function(r){ return r._id == product.id});
							if(item){
								item.product = product;
							}
						});
						resolve(ret);
					})
					.catch(function(ex){
						reject(ex);
					});
				});
		});
	}))

	.get('/', 'productsall', function(req, res, next) {

		try {
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

			Product.find(query)
				.sort({_id: 1})
				.execAsync()
				.then(function(products) {

					var list = products.map(function(p) {
						var obj = p.toObject();
						if (obj.image){
							//console.log(req);
							
							obj.imageUrl = 'http://' +req.header('Host') + '/images/' + obj.image;
							//obj.imageUrl = "http://localhost:3000/images/" + obj.image;
						}
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
						//obj.imageUrl = 'http://localhost:3000/images/' + file._id;
						obj.imageUrl = 'http://' +req.header('Host') + '/images/' + file._id;

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
			obj.imageUrl = 'http://' +req.header('Host') + '/images/' + obj.image;
			//obj.imageUrl = "http://localhost:3000/images/" + obj.image;

		res.send(obj);
		next();
	});
};
//module.exports = router;