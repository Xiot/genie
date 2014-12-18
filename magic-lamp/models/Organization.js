var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var organizationSchema = new Schema({
    name: { type: String, required: true },
    alias: {type: String, required: false}
    //locations: []
});

module.exports = mongoose.model('Organization', organizationSchema);