var mongoose = require('mongoose');
//var router = require('express').Router();
var Token = mongoose.model('Token');

var jwt = require('jsonwebtoken');
var moment = require('moment');

module.exports.init = function (server, config){
    
    var basicAuth = config.passport.authenticate('basic');
    var bearerAuth = config.passport.authenticate('bearer');

    server.get('/tokens/current', /*bearerAuth,*/ function(req, res, next){
        
console.log('/tokens/current');
        res.send(req.user);
        next();
    });

    server.post('/tokens', basicAuth, function (req, res, next) {
                
        var token = new Token({
            user: req.user,
            //token
        });
        
        token.saveAsync()
        .spread(function (t) {
            
            var btoken = {
                expires: moment.utc().add(14, 'd').valueOf(),
                firstName: req.user.firstName,
                lastName : req.user.lastName,
                email: req.user.email,
                user_id: req.user.id,
                token_id: t.id
            };
            
            var signedToken = jwt.sign(btoken, "djinn", { expiresInMinutes: 14 * 24 * 60 });
            res.send({
                auth_token: signedToken                
            });            
            next();

            //res.send(t);
        }).catch(function (ex) {
            next(ex);
        })
    });

    //server.use('/tokens', router); 
}