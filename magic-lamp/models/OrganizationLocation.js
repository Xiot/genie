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
    geo: {type: [Number], index:'2dsphere'}
});

locationSchema.statics.nearInKmAsync = function (coords, distance, cb) {
    return geoUtil.nearInKmAsync(this, coords, distance, cb);
    //distance = distance || 0.01;
    //return this.find({ geo: { $near: coords, $maxDistance: distance } }, cb);
}

var model = mongoose.model('OrganizationLocation', locationSchema);

//bluebird.promisifyAll(model);
//bluebird.promisifyAll(model.prototype);

module.exports = model;