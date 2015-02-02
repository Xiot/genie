var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var id = Schema.Types.ObjectId;

var schema = new Schema({
	name: {type: String, required: true},
	store: {type: id, ref: 'OrganizationLocation'}
});

var model = mongoose.model('Department', schema);

module.exports = model;