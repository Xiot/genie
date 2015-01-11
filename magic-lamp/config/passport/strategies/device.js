var passport = require('passport');
var util = require('util');

function DeviceStrategy(options, verify) {
	if (typeof options === 'function') {
		verify = options;
		options = {};
	}

	if (!verify)
		throw new Error('Device authentication strategy requires a verify function');

	passport.Strategy.call(this);
	this.name = 'device';
	this._verify = verify;
}

util.inherits(DeviceStrategy, passport.Strategy);

DeviceStrategy.prototype.authenticate = function(req) {
	var header = extractAuthorization(req);
	if (!header)
		return this.fail();

	if (header.scheme !== 'device')
		return this.fail();


	var self = this;

	function verified(err, user){
		if(err)
			return self.error(err);
		if(!user)
			return self.fail();
		self.success(user, {stategy: 'device'});
	}

	this._verify(header.parameter, verified);
}

function extractAuthorization(req) {
	var header = req.headers['authorization'];
	if (!header)
		return null;

	var split = header.split(' ');
	if (split.length < 2)
		return null;

	return {
		scheme: split[0],
		parameter: split[1]
	};
}

module.exports = DeviceStrategy;