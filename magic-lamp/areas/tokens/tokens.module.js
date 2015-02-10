var mongoose = require('mongoose');
//var router = require('express').Router();
var Token = mongoose.model('Token');

var jwt = require('jsonwebtoken');
var moment = require('moment');

module.exports.init = function(server, config) {

    var basicAuth = config.passport.authenticate('basic');
    var bearerAuth = config.passport.authenticate('bearer');

    server.get('/tokens/current', bearerAuth, function(req, res, next) {

        if (!req.user)
            return next(401, 'Unauthorized');

        setTimeout(function() {
            res.send(req.user);
            next();
        }, 1000)


    });

    server.post('/tokens', basicAuth, function(req, res, next) {

        var token = new Token({
            user: req.user,
            //token
        });

        token.saveAsync()
            .spread(function(t) {

                var btoken = {
                    expires: moment.utc().add(14, 'd').valueOf(),
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email,
                    user_id: req.user.id,
                    token_id: t.id
                };

                var signedToken = jwt.sign(btoken, "djinn", {
                    expiresInMinutes: 14 * 24 * 60
                });
                return signedToken;
                // res.send({
                //     auth_token: signedToken                
                // });
                // next();

                //res.send(t);
            })
            .then(function(token) {
                return setUserDefaultStatusAsync(req.user)
                    .then(function() {
                        return token;
                    });
            })
            .then(function(token) {
                res.send({
                    auth_token: signedToken
                });
                next();
            })
            .catch(function(ex) {
                next(ex);
            })
    });

    server.del('/tokens/:tokenId', function(req, res, next) {

        Token.getByIdAsync(req.params.tokenId)
            .then(function(token) {
                return token.removeAsync();
            })
            .then(function() {
                req.user.status = 'offline';
                return req.user.saveAsync();
            })
            .then(function(user) {
                next();
            })
            .catch(function(ex) {
                next(new Error(ex));
            });
    });

    function setUserDefaultStatusAsync(user) {

            return Task.findAsync({
                    assigned_to: user._id
                })
                .then(function(tasks) {
                    if (!tasks || tasks.length === 0)
                        return 'available'
                    return 'busy'
                })
                .then(function(status) {
                    user.status = status;
                    return user.saveAsync();
                });
        }
        //server.use('/tokens', router); 
}