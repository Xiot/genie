var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Organization = mongoose.model('Organization');

module.exports = function (passport) {
    
    router.param('org_id', function (req, res, next, id) {
        
        var orgSearch = isObjectId(id)
            ? Organization.findByIdAsync(id)
            : Organization.findOneAsync({ alias: id });
                
        orgSearch
        .then(function (x) {
            req.org = x;
        }).catch(function (ex) {
            next(ex);
        });
    });
    
    router.get('/', function (req, res, next) {

        Organization.findAsync()
        .then(function (orgs) {
            res.send(orgs);
        }).catch(function (ex) {
            next(ex);
        });
    });
    
    router.get('/:org_id', function (req, res, next) {
        res.send(req.org);
    });

    return router;
}
function isObjectId(n) {
    return mongoose.Types.ObjectId.isValid(n);
}