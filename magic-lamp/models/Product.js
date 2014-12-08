var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false }
});

//var model = mongoose.Model('Product', productSchema);

var model = mongoose.model('Product', productSchema);

module.exports = model;