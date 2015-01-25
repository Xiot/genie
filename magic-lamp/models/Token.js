var mongoose = require('mongoose');
var User = require('./User.js');

var tokenSchema = new mongoose.Schema({
    issuedDate: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String },
    expires: {type: Date}    
});

module.exports = mongoose.model('Token', tokenSchema);