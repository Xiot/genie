﻿var express = require('express');
var router = express.Router();
var Product = load('~/models/Product');
var errors = load('~/core/errors/index');

module.exports = function (passport) {
    
    /* GET users listing. */
    router.get('/',passport.authenticate('localapikey'), function (req, res) {
        Product.find(function (err, p) {
            if (!err) {
                res.send(p);
            } else {
                console.log('err: ' + err);
            }
        });
    });
    
    router.get('/:id', function (req, res, next) {
        Product.findByIdAsync(req.params.id)
                .then(function (p) {
            res.send(p);
        }).catch(function (err) {
            next(new errors.NotFound('no product'));
        });
    });
    
    router.post('/', function (req, res, next) {
        var p = new Product(req.body);
        p.saveAsync()
    .spread(function (w) {
            res.send(w);

        }).catch(function (e) {
            next(new errors.ServerError(e));
        });
    });
    return router;
};
//module.exports = router;

