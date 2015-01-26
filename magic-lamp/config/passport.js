//var passport = require('passport');
var basic = require('./passport/basic.js');
var apiKey = require('./passport/token.js');
var bearer = require('./passport/bearer.js');
var device = require('./passport/device.js');
var User = require('mongoose').model('User');

var localAuth = load('~/core/security/authentication.service');

module.exports = function (server, passport){
    
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    
    passport.deserializeUser(function (id, done) {
        
        User.findByIdAsync(id).then(function (user) {
            done(null, user);
        }).catch(function (ex) {
            done(ex);
        });
    });

    // var init = passport.initialize();
    // server.use(function(req, res, next){
    //     try{

    //         return init(req,res,next);

    //     } catch(ex){
            
    //         next(ex);
    //     } 
    // });

    server.use(localAuth.device());
    server.use(passport.initialize());  

    passport.use(basic);
    passport.use(apiKey);
    passport.use(bearer);
    passport.use(device);


    var deviceMiddleware = function(req, res, next){
        passport.authenticate(['device', 'bearer'], function(err, user, info){
            req.authenticated = !!user;
            req.user = user;

            // if(user)
            //     console.log('authenticated', user.toObject({virtuals: true}));

            next();
        })(req, res,next);
    };
    server.use(deviceMiddleware);
}

