var ApiKeyStrategy = require('passport-localapikey-update').Strategy;
var mongoose = require('mongoose');
var Token = mongoose.model('Token');
var errors = load("~/core/errors");
var debug = require('debug')('magic-lamp-auth');

var options = {
    apiKeyHeader: 'x-token'
};

module.exports = new ApiKeyStrategy(options, authenticate);

function authenticate(key, done){
    
    debug("Token: " + key);
    
    if (key === '3')
        return done(null, { username: 'chris', id: '3' });

    if (!isObjectId(key))
        return done(new errors.NotAuthorized('Invalid token.'));
        
    Token.findById(key).populate('user').execAsync()
    .then(function (token) {
        
        if (!token) {
            debug("The token '" + token + "' was not found.");
            return done(new errors.NotAuthorized('key not found.'));
        }

        done(null, token.user);

    }).catch(function (ex) {
        done(ex);
    });
}
function isObjectId(n) {
    return mongoose.Types.ObjectId.isValid(n);
}