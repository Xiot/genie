var mongoose = require('mongoose');
var id = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var chatLogSchema = new Schema({
    startTime: {type: Date, default: Date.now},
    store: {type: id, ref: 'OrganizationLocation', route: 'store.get'},
    participants: {type: [id], ref: 'User'},
    messages: []
});


module.exports = mongoose.model('ChatLog', chatLogSchema); 