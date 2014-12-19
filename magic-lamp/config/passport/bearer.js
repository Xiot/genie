var jwt = require('jsonwebtoken');
var BearerStrategy = require('passport-http-bearer').Strategy;
var debug = require('debug')('magic-lamp-auth');
var mongoose = require('mongoose');
var Token = mongoose.model('Token');
var ObjectId = mongoose.Types.ObjectId;
var moment = require('moment');

module.exports = new BearerStrategy(authenticate);

function authenticate(encryptedToken, done) {
    
    var jtoken = jwt.decode(encryptedToken);
        
    Token.findById(jtoken.token_id)
    .populate('user')
    .execAsync()
    .then(function (token) {
        if (!token) {
            debug('The token could not be found');
            return done(null, false, { message: 'Token not found.' });
        }
        
        if (token.expires < Date.now()) {
            debug("The token '" + token.id + "' has expired.");
            return done(null, false, { message: 'Token expired.' });
        }
    
        return done(null, token.user);

    }).catch(function (ex) {
        return done(ex);

    });

};