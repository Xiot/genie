var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
	user: {type: ObjectId, ref: 'User'},
	message: String,
	type: {type: String, enum: ['message']},
	created: {type: Date, default: Date.now},
	viewed: {type: Boolean},

	key: ObjectId,
	subKey: ObjectId,
	data: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Notification', schema);