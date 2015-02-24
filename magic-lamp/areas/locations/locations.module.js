
var mongoose = require('mongoose');
var Store = mongoose.model('OrganizationLocation');
var ServerError = load("~/core/errors").ServerError;
var geoUtil = load("~/models/util/geo");

module.exports.init = function(server, config) {

	server.route('/locations')
		.get('/', 'location.get', function(req, res, next) {
			var beacon = req.query.beacon_id;

			var lat = parseFloat(req.query.lat);
			var long = parseFloat(req.query.lng);
			var limit = parseFloat(req.query.limit) || 5;
			var distance = parseFloat(req.query.distance) || 20;

			var point = geoUtil.createPoint(long, lat);
			var opt = geoUtil.createOptionsKm(distance);

			Store.findById("54bbe9e04c72702035848af9")
			.populate('organization')
			.execAsync()
			.then(function(store){
				res.send([store]);
				next();
			});

		});
}