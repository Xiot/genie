var mongoose = require('mongoose');
var id = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    type: { type: String, enum: ['request', 'task'], default: 'task' },
    store: {type: id, ref: 'OrganizationLocation'},
    title: { type: String },
    details: { type: String },
    created_by: { type: id, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    complete: { type: Boolean },
    created_loc: { type: [Number] },
    assigned_to: { type: id, ref: 'User' }
});

module.exports = mongoose.model('Task', schema);