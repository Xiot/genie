
var mongoose = require('mongoose');

function AuthenticationService(){

    function basic(){
        return basicMiddleware;
    }

    function basicMiddleware(req, res, next){

    }

    function tokenMiddleware(req, res, next){

    }
}

module.exports = new AuthenticationService();