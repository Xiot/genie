var mongoose = require('mongoose');
var debug = require('debug')('magic-lamp-images');
var File = mongoose.model('File');

module.exports = {
	init: function(server, config) {

		var route = server.route('/images');
		// route.param('image_id', function(req, res, next, value){
		// 	mongoose.files.get(value)
		// })
		route.get('/:image_id', 'get-image', function(req, res, next) {
			debug('images-get');

			try {
				var imageId = req.params.image_id;

				File.findByIdAsync(imageId)
				.then(function(image){

					image.send(res);
					next();
					// var stream = image.openRead();
					// res.writeHead(200, {
					// 	'Content-Type': image.contentType
					// });
					// stream.pipe(res);
				}).catch(function(ex){
					next(new Error(ex));
				});

				// mongoose.files.getInfo(imageId).then(function(info) {
				// 	info = info[0];
				// 	debug('info', info);

				// 	var stream = mongoose.files.get(req.params.image_id);

				// 	res.writeHead(200, {
				// 		'Content-Type': info.contentType
				// 	});

				// 	stream.pipe(res);
				// 	stream.on('close', function(f) {
				// 		next();
				// 	});

				// }).catch(function(ex) {
				// 	next(new Error(ex));
				// });

			} catch (ex) {
				next(new Error(ex));
			}
		});
	}
}