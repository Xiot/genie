//var express = require('express');
//var router = express.Router();
var Product = load('~/models/Product');
var errors = load('~/core/errors/index');
var debug = require('debug')('magic-lamp-products');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(null); }
    next();
    //res.redirect('/error')
}

module.exports = function (server, passport) {
    
    /* GET users listing. */
    server.get('/products', 
        passport.authenticate([  'bearer']), 
        //passport.authenticate('localapikey'),
        
        function (req, res) {
        
        debug(req.user);

        Product.find(function (err, p) {
            if (!err) {
                res.send(p);
                next();
            } else {
                console.log('err: ' + err);
                next(err);
            }
        });
    });
    
    server.get('/products//:id', function (req, res, next) {
        Product.findByIdAsync(req.params.id)
        .then(function (p) {
            res.send(p);
             next();
        }).catch(function (err) {
            next(new errors.NotFound('no product'));
        });
    });
    
    server.post('/products', function (req, res, next) {
        var p = new Product(req.body);
        p.saveAsync()
        .spread(function (w) {
            res.send(w);
            next();
        }).catch(function (e) {
            next(new errors.ServerError(e));
        });
    });
    //return server;
};
//module.exports = router;

