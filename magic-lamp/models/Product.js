var mongoose = require('mongoose');
//var 
var Schema = mongoose.Schema;
var id = Schema.Types.ObjectId;

var productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    store: {type: id, ref: 'OrganizationLocation'},
    image: {type: id},
    department: {type: id, ref: 'Department'},

    specs: {type: Schema.Types.Mixed},
    upc: String,
    location: String,

    price: Number,
    rating: Number
    //images: []
});

productSchema.index({name: 'text', description: 'text'});
//var model = mongoose.Model('Product', productSchema);

var model = mongoose.model('Product', productSchema);

module.exports = model;