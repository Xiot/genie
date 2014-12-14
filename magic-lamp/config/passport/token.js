var ApiKeyStrategy = require('passport-localapikey-update').Strategy;
var mongoose = require('mongoose');
var Token = mongoose.model('Token');

var debug = require('debug')('magic-lamp-auth');

var options = {
    apiKeyHeader: 'x-token'
};

var s = new ApiKeyStrategy(options, authenticate);
debug(s);

module.exports = s;

function authenticate(key, done){
    
    debug("Token: " + key);
    
    // do a graceful check to see if `key` can be cast to an ObjectId

    Token.findById(key).populate('user').execAsync()
    .then(function (token) {
        
        if (!token) {
            debug("The token '" + token + "' was not found.");
            return done(null, false, { message: 'key not found.' });
        }

        done(null, token.user);

    }).catch(function (ex) {
        done(ex);
    });

}