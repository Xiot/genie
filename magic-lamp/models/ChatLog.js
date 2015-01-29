var mongoose = require('mongoose');
var id = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;


var messageSchema = new Schema({
	message: {type: String},
	time: {type: Date, default: Date.now},
	user: {type: id, ref: 'User'}
});

var chatLogSchema = new Schema({
    startTime: {type: Date, default: Date.now},
    lastMessageTime: {type: Date, default: Date.now},

    store: {type: id, ref: 'OrganizationLocation', route: 'store.get'},
    participants: [{type: id, ref: 'User'}],
        
    closed: {type: Boolean, default: false},
    
	product: {type: id, ref: 'Product'},
    messages: [messageSchema]
});


module.exports = mongoose.model('ChatLog', chatLogSchema); 