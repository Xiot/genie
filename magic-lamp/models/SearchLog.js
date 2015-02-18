var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var oid = Schema.Types.ObjectId;

var schema = new Schema({
	user: {type: oid, ref: 'User'},
	store: {type: oid, ref: 'OrganizationLocation'},
	searchText: {type: String},
	timestamp: {type: Date, default: Date.now},
}, {collection: 'logs.search'});

var model = mongoose.model('SearchLog', schema);

module.exports = model;