﻿
//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var ChatLog = mongoose.model('ChatLog');

var debug = require('debug')('magic-lamp-users');
var Promise = require('bluebird');

var formatter = load('~/core/services/formatter');

formatter.handle(User, function(obj, req) {
    
    var value = obj.toObject();

    value.id = obj.id;
    delete value._id;
    delete value.__v;
    
    delete value.password_hash;
    delete value.password_salt;

    // if(obj.product && obj.product instanceof Product) {
    //     value.product = formatter.format(obj.product, req);
    // }

    return value;

});

module.exports = function (server, passport){

    var router = server.route('/users')

    .post('/', function (req, res, next) {

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

    var userRoute = router.route('/:user_id')
    .param('user_id', function(req, res, next, value){
        
        req.route.user = function(){
            
            return new Promise(function(resolve, reject){
                if(value === 'me')
                    return resolve(req.user);

                User.findByIdAsync(value)
                .then(function(user){
                    resolve(user);
                }).catch(function(ex){
                    reject(ex);
                });
            })            
        }

        if(value === 'me'){
            req.query.user_id = req.user.id;
        }

        next();
    })

    .get('/', function(req, res, next){
        
        req.route.user()
        .then(function(user){
            res.send(user);
        }).catch(function(ex){
            next(new Error(ex));
        });

        //res.send(req.route.user);
        //next();
    })

    .get('/chats', function(req, res, next){

        var storeId = req.query.store;
        var query = {participants: req.query.user_id};
        if(storeId){
            query.store = storeId;
        }

        ChatLog.find(query)
        //.slice('messages', -1)
        .populate('participants')
        .sort({lastMessageTime: -1})
        .execAsync()
        .then(function(logs){
            res.send(logs);
            next();
        }).catch(function(ex){
            next(new Error(ex));
        });
    });

    load('~/areas/notifications/notifications.routes')(userRoute);

    //return router;
}