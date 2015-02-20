var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var id = Schema.Types.ObjectId;

var schema = new Schema({
	name: {type: String, required: true},
	store: {type: id, ref: 'OrganizationLocation'},
	parents: [{type: id, ref: 'OrganizationLocation'}],
	image: {type: id, ref: 'File'}
});

var model = mongoose.model('Department', schema);

module.exports = model;