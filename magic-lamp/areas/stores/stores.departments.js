var mongoose = require('mongoose');
var wrap = load('~/core/routes/promiseRouter');
var Department = mongoose.model('Department');
var upload = load('~/core/services/image.upload');

var formatter = load('~/core/services/formatter');

formatter.handle(Department, function(obj, req) {
	

		var value = {
			id: obj.id, 
			name: obj.name,
			_links: {
				store: req.link('stores-id', {store_id: obj.store})
			}
		};		

		if(obj.image)
			value.image = req.link('get-image', {image_id: obj.image});

		return value;

	});

module.exports = function(server){


	server.get('/', async function(req) {
		var query = {
			store: req.store._id,
			parents: {$size: 0}
		};
		
		var depts = await Department.findAsync(query);
		//var depts = await Department.find(query).populate('store').execAsync();
		return depts;
	});

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