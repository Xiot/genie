var express = require('express');
var router = express.Router();

var products = require('../models/Product');

// TODO extract this into a generic HttpError
function NotFound(msg) {    
    this.statusCode = 404;
    this.message = msg;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
NotFound.prototype = new Error();
NotFound.prototype.constructor = NotFound;
NotFound.prototype.name = 'NotFound';

/* GET users listing. */
router.get('/', function (req, res) {
    products.find(function (err, p) {
        if (!err) {
            res.send(p);
        } else {
            console.log('err: ' + err);
        }
    });
});

router.get('/:id', function (req, res, next) {
    products.findByIdAsync(req.params.id)
    .then(function (p) {
        res.send(p);
    }).catch(function (err) {
        next(new NotFound('no product'));
    });    
});

router.post('/', function (req, res) {
    var p = new products(req.body);
    p.saveAsync()
    .spread(function (w) {
        res.send(w);
    }).catch(function (e) {
        res.statusCode = 500;
        res.send(e);
        res.end();
    });    
});

module.exports = router;