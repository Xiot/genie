
var mongoose = require('mongoose');

function AuthenticationService(){

	this.basic = basic;


    function basic(){
        return basicMiddleware;
    }

    function basicMiddleware(req, res, next){
    	
    	var header = req.headers['authorization'];

    	if(!header)
    		return next();

    	var split = header.split(' ');
    	if(split.length < 2)
    		next();

    	if(split[0] !== 'user')
    		next();

    	req.user = {
    		id: 'cthomas'
    	}

    	console.log('user: ', req.user);

		next();
    }

    function tokenMiddleware(req, res, next){

    }
}

module.exports = new AuthenticationService();