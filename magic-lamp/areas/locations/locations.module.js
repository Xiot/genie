﻿var router = require('express').Router();
var mongoose = require('mongoose');
var Store = mongoose.model('OrganizationLocation');
var ServerError = load("~/core/errors").ServerError;
var geoUtil = load("~/models/util/geo");

module.exports.init = function (app, config){

    router.get('/', function (req, res, next) {
        var beacon = req.query.beacon_id;
        
        var lat = parseFloat(req.query.lat);
        var long = parseFloat(req.query.lng);
        var limit = parseFloat(req.query.limit) || 5;
        var distance = parseFloat(req.query.distance) || 20;
    
        
        var point = geoUtil.createPoint(long, lat);
        var opt = geoUtil.createOptionsKm(distance);
        console.log(point);
        
        // http://stackoverflow.com/questions/24197235/how-do-i-populate-sub-document-after-geonear

        Store.geoNear(point, opt)
        .execAsync()
        .then(function (r) {
            console.log(r);
            res.send(r);

        }).catch(function (ex) {
            next(new ServerError(ex));
        });

    });

    app.use('/location', router);
}