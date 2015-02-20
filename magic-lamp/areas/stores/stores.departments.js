var mongoose = require('mongoose');
var wrap = load('~/core/routes/promiseRouter');
var Department = mongoose.model('Department');
var upload = load('~/core/services/image.upload');

var formatter = load('~/core/services/formatter');

module.exports = function(server){

	formatter.handle(Department, function(obj, req) {
		
		var value = {
			id: obj.id, 
			name: obj.name
		};		

		if(obj.image)
			value.image = req.link('getimagesimage_id', {image_id: obj.image});

		return value;

	});

	server.get('/', wrap(function(req){

		var query = {
			store: req.store._id,
			parents: {$size: 0}
		};

		return Department.findAsync(query)
		.then(function(depts){
			return formatter.format(depts, req);
		});

	}));

	server.post('/', wrap(function(req){

		return upload(req, {metadata: {store: req.store._id}})
		.then(function(images) {

			var dept = new Department(req.body);
			dept.store = req.store;

			if(images && images.length === 1)
				dept.image = images[0];

			return dept.saveAsync()
			.spread(function(d){
				return formatter.format(d);
			});
		});

	}));
}