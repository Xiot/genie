var mongoose = require('mongoose');
var User = mongoose.model('User');
var DeviceStrategy = require('./strategies/device');
var ApiKeyStrategy = require('passport-localapikey-update').Strategy;

var debug = require('debug')('magic-lamp-auth-device');

var apiKeyOptions = {
	apiKeyHeader: 'x-device'
};

var authenticator = new ApiKeyStrategy(apiKeyOptions, authenticate); //new DeviceStrategy(authenticate);
authenticator.name = 'device';

module.exports = authenticator;

function authenticate(deviceId, done) {

	debug(deviceId);

	User.findOneAsync({
			device: deviceId
		})
		.then(function(user) {
			
        	user.authType = 'device';
        	// user.auth.device = true;

        	//debug('good: ', user);
			done(null, user);

		}).catch(function(ex) {
			debug('bad:', ex);
			done(new Error(ex));
		});
}