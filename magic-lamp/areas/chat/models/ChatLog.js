var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatLogSchema = new Schema({
    startTime: Date,
    messages: []
});

module.exports = mongoose.model('ChatLogs', chatLogSchema);