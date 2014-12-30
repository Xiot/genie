var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');

var Organization = mongoose.model('Organization');

module.exports = function(server, passport) {

    server.get('/organizations', function(req, res, next) {

        Organization.findAsync()
            .then(function(orgs) {
                res.send(orgs);
                next();
            }).catch(function(ex) {
                next(ex);
            });
    });

    server.get('/organizations/:org_id', [idParser,
        function(req, res, next) {
            res.send(req.org);
            next();
        }
    ]);

    return server;
}

function idParser(req, res, next) {
    var id = req.params.id;

    var orgSearch = isObjectId(id) ? Organization.findByIdAsync(id) : Organization.findOneAsync({
        alias: id
    });

    orgSearch
        .then(function(x) {
            req.org = x;
            next();
        }).catch(function(ex) {
            next(ex);
        });
}

function isObjectId(n) {
    return mongoose.Types.ObjectId.isValid(n);
}