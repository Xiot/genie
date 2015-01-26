var mongoose = require('mongoose');

var pid = process.pid;
var machineName = require('os').hostname();

var schema = new mongoose.Schema({
	url: {type: String, required: true},
	startTime: Date,
	timeTaken: Number,
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	method: String,
	process: {type: String, default: pid },
	machine: {type: String, default: machineName},
	statusCode: Number,
	routeName: String,
	userAgent: mongoose.Schema.Types.Mixed,
	params: mongoose.Schema.Types.Mixed

},  {collection: 'metrics.requests'});

module.exports = mongoose.model('RequestMetric', schema);