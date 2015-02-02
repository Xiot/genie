var mongoose = require('mongoose');
var id = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    
    title: { type: String },
    details: { type: String },
    type: { type: String, enum: ['request', 'task'], default: 'task' },

    created_by: { type: id, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    
    created_loc: { type: [Number] },
    
    assigned_to: { type: id, ref: 'User' },
    assigned_at: {type: Date},

	store: {type: id, ref: 'OrganizationLocation'},
    customer: {type: id, ref: 'User'},
    product: {type: id, ref: 'Product'},
    chat: {type: id, ref: 'ChatLog'},
    
    status: {type: String, enum: ['unassigned', 'assigned', 'engaged', 'complete'], default: 'unassigned'},
    complete: { type: Boolean, default: false }
});

schema.pre('save', function(next){
	this.increment();

	if(this.isModified('assigned_to') && !this.assigned_at)
		this.assigned_at = Date.now();

	next();
});

schema.virtual('isRequest')
	.get(function(){ return this.type === 'request'});

module.exports = mongoose.model('Task', schema);