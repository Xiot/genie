var mongoose = require('mongoose');
var User = mongoose.model('User'); //require('../models/User');
var BasicStrategy = require('passport-http').BasicStrategy;

module.exports = new BasicStrategy(authenticate);

var debug = require('debug')('magic-lamp-auth');

function authenticate(username, password, done) {
    User.findOneAsync({ username: username })
    .then(function (user) {

        if (!user) {
            debug('The user \'' + username + "' was not found.");
            return done(null, false, { message: "User not found." });
        }
            
        if (!user.validatePassword(password)) {
            debug("Invalid password for user '" + username + "'.");
            return done(null, false, { message: "Invalid username or password." });
        }
            

        return done(null, user);

    }).catch(function (err) {
        done(err);
    });
}