//var router = require('express').Router();
var mongoose = require('mongoose');
var Store = mongoose.model('OrganizationLocation');
var ServerError = load("~/core/errors").ServerError;
var geoUtil = load("~/models/util/geo");

module.exports.init = function (server, config){

    server.get('/locations', function (req, res, next) {
        var beacon = req.query.beacon_id;
        
        var lat = parseFloat(req.query.lat);
        var long = parseFloat(req.query.lng);
        var limit = parseFloat(req.query.limit) || 5;
        var distance = parseFloat(req.query.distance) || 20;
    
        
        var point = geoUtil.createPoint(long, lat);
        var opt = geoUtil.createOptionsKm(distance);
        console.log(point);
        
        // http://stackoverflow.com/questions/24197235/how-do-i-populate-sub-document-after-geonear

        Store.geoNearAsync(point, opt)        
        .spread(function (results, stats) {
            console.log(stats);
            
            var stores = results.map(function (storeData) {
                var store = new Store(storeData.obj);
                return store;
            });
            
            Store.populateAsync(stores, { path: "organization" })
            .then(function (obj){
                res.send(obj);
            }).catch(function (ex){
                next(new ServerError(ex));
            })

            //res.send(results);

        }).catch(function (ex) {
            next(new ServerError(ex));
        });

    });

    
}
