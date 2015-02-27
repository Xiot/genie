var mongoose = require('mongoose');
var Schema = mongoose.Schema;
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
    department: {type: id, ref: 'Department'},
    chat: {type: id, ref: 'ChatLog'},
    
    searchText: {type: String},

    status: {type: String, enum: ['unassigned', 'assigned', 'engaged', 'complete'], default: 'unassigned'},
    complete: { type: Boolean, default: false },

    timings: {
        unassigned: {
            start: {type: Date, default: Date.now},
            end: Date
        },
        assigned: {
            start: Date,
            end: Date
        },
        engaged: {
            start: Date,
            end: Date
        },
        complete: {
            total: Number,
            start: Date
            //end: Date
        }
    }
});

schema.post('init', function(){
    this.original = {
        status: this.status,
    }
});

schema.pre('save', function(next){
	
    this.increment();

    var now = Date.now();

	if(this.isModified('assigned_to') && !this.assigned_at) {
		this.assigned_at = Date.now();
        this.status = 'assigned';
    }

    if(this.isModified('status')) {

        var lastStatus = this.original.status;
        
        this.set('timings.' + lastStatus + '.end', now);
        this.set('timings.' + this.status + '.start', now);
        
        if(this.status === 'complete'){
            this.complete = true;

            this.set('timings.complete.total', now - this.created_at);
        }
    }

	next();
});

schema.virtual('isRequest')
	.get(function(){ return this.type === 'request'});

module.exports = mongoose.model('Task', schema);