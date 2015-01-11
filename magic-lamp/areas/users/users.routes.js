
//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');

var debug = require('debug')('magic-lamp-users');

module.exports = function (server, passport){

    server.post('/users', function (req, res, next) {

        var newUser = new User(req.body);
        
        newUser.saveAsync()
        .spread(function (user) {
            res.send(200, user);
            next();

        }).catch(function (err) {

            debug(err);
            next(err);
        });
    });

    //return router;
}