//var passport = require('passport');
var basic = require('./passport/basic.js');
var apiKey = require('./passport/token.js');
var bearer = require('./passport/bearer.js');

var User = require('mongoose').model('User');

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

    server.use(passport.initialize());

    passport.use(basic);
    passport.use(apiKey);
    passport.use(bearer);
}

