var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var geoUtil = require('./util/geo.js');
var bluebird = require('bluebird');

var locationSchema = new Schema({
    name: { type: String, required: true },
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
    address: {
        street: String,
        unit: String,
        city: String,
        state: String,
        postalCode: String
    },
    geo: {type: [Number], index:'2dsphere'},
    alias: {type: String, index: true}
});

locationSchema.options.toJSON = {
  transform: function(store) {
    
    var obj = store.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return obj;
  }
};


locationSchema.links = {
    href: {route: 'store.get', params: {store_id: 'id'}}
}

locationSchema.statics.nearInKmAsync = function (coords, distance, cb) {
    return geoUtil.nearInKmAsync(this, coords, distance, cb);    
}

var model = mongoose.model('OrganizationLocation', locationSchema);


module.exports = model;