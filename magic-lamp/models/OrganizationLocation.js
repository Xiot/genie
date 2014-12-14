var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var locationSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String }
});

module.exports = mongoose.model('OrganizationLocation', locationSchema);