
var mongoose = require('mongoose');
var User = mongoose.model('User');

function AuthenticationService(){

	this.basic = basic;
    this.device = function(){return device;};

    function basic(){
        return basicMiddleware;
    }

    function basicMiddleware(req, res, next){
    	
    	var header = req.headers['authorization'];

    	if(!header)
    		return next();

    	var split = header.split(' ');
    	if(split.length < 2)
    		return next();

    	if(split[0] !== 'user')
    		return next();

    	req.user = {
    		id: 'cthomas'
    	}

    	console.log('user: ', req.user);

		next();
    }

    function tokenMiddleware(req, res, next){

    }

    function device(req, res, next){

        var header = extractAuthorization(req);
        if(!header)
            return next();

        if(header.scheme !== 'device')
            return next();

        User.findOneAsync({device: header.parameter})
        .then(function(user){
            req.user = user;
            next();
        }).catch(function(ex){
            next(new Error(ex));
        });
    }

    function extractAuthorization(req){
        var header = req.headers['authorization'];
        if(!header)
            return null;

        var split = header.split(' ');
        if(split.length < 2)
            return null;
        
        return {
            scheme: split[0],
            parameter: split[1]
        };
    }
}

module.exports = new AuthenticationService();