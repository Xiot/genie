var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var id = mongoose.Schema.Types.ObjectId;

var taskLogSchema = new mongoose.Schema({
    timestamp: {type: Date, default: Date.now},
    action: String,
    value: String,
    details: mongoose.Schema.Types.Mixed,
    user: {type: id, ref: 'User'}
});

var schema = new mongoose.Schema({

    title: { type: String },
    details: { type: String },
    type: { type: String, enum: ['chat', 'call-associate', 'internal'], required: true },

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
    productDetails: {type: mongoose.Schema.Types.Mixed},

    //status: {type: String, enum: ['unassigned', 'assigned', 'engaged', 'complete'], default: 'unassigned'},
    status: {type: String, enum: ['unassigned', 'assigned', 'engaged', 'closed', 'aborted'], default: 'unassigned'},
    complete: { type: Boolean, default: false },
    completed_at: {type: Date},

    // type:chat specifics
    transfered_to: {type: id, ref: 'Task'},
    transfered_from: {type: id, ref: 'Task'},

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
        closed: {
            total: Number,
            start: Date
        }
    },

    log: [taskLogSchema]
}, {collection: 'tickets'});

schema.post('init', function(){
    this.original = {
        status: this.status,
    }
});

schema.post('save', function(doc){
    if(!doc.original)
        doc.original = {};
    doc.original.status = this.status;
})
schema.pre('save', function(next){

    this.increment();

    var now = this.logDate || Date.now();

	if(this.isModified('assigned_to') && !this.assigned_at) {
		this.assigned_at = now;
        this.status = 'assigned';
    }

    if(this.isNew){

        this.log.push({
            timestamp: now,
            action: 'status',
            value: 'created'
        });

        this.timings.unassigned.start = now;
    }

    if(this.isModified('status')) {

        var lastStatus = this.original.status;

        this.set('timings.' + lastStatus + '.end', now);
        this.set('timings.' + this.status + '.start', now);

        if(this.status === 'closed' || this.status === 'aborted'){
            this.complete = true;
            this.completed_at = now;

            this.set('timings.' + this.status + '.total', (now - this.created_at).valueOf());
        }
        this.log.push({
            timestamp: now,
            action: 'status',
            value: this.status,
            //user:
            details: {
                //user:
            }});
    }

	next();
});

schema.virtual('isInternal')
	.get(function(){ return this.type === 'internal'});

module.exports = mongoose.model('Task', schema);
