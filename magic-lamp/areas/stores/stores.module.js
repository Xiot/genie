var mongoose = require('mongoose');
//var router = require('express').Router();
//var storeRoutes = require('express').Router();

var passport = require('passport');

var errors = load('~/core/errors');
var NotFound = errors.NotFound;
var ServerError = errors.ServerError;

var Store = mongoose.model('OrganizationLocation');
var Product = mongoose.model('Product');
var Task = mongoose.model('Task');

var debug = require('debug')('magic-lamp-stores');

module.exports.init = function(server, config) {

    server.get('/stores', function(req, res, next) {
        Store.find()
            .populate('organization')
            .execAsync()
            .then(function(x) {
                res.send(x);
                next();
            }).catch(function(ex) {
                next(ex);
            });
    });

    server.get('/stores/:store_id', storeMiddleware, function(req, res) {
        res.send(req.store);
    });

    server.get('/stores/:store_id/products', storeMiddleware, function(req, res, next) {

        Product.findAsync({
                store: req.store.id
            })
            .then(function(products) {
                res.send(products);
            }).catch(function(ex) {
                next(new ServerError(ex));
            });
    });

    server.get('/stores/:store_id/tasks', storeMiddleware, function(req, res, next) {

        Task.findAsync({
                store: req.store.id
            })
            .then(function(tasks) {
                res.send(tasks);

            }).catch(function(ex) {
                return next(new ServerError(ex));
            })
    });

    server.post('/stores/:store_id/tasks',
        storeMiddleware,
        passport.authenticate('bearer'),
        function(req, res, next) {

            debug('post');

            var task = new Task(req.body);
            task.store = req.store;
            task.created_by = req.user;

            task.saveAsync()
                .spread(function(ret) {
                    res.send(ret);
                    debug('success: ', ret);
                    next();
                }).catch(function(ex) {
                    debug('fail: ', ex);
                    next(ex);
                });

        });

    // server.use('/stores/:store_id',         
    //     storeMiddleware,
    //     storeRoutes);

    // server.use('/stores', router);
}

//function 

function storeMiddleware(req, res, next) {
    var storeId = req.params.store_id;

    if (!mongoose.Types.ObjectId.isValid(storeId))
        return next(new NotFound('The store can not be found.'));

    Store.findByIdAsync(storeId)
        .then(function(store) {
            if (!store)
                return next(new NotFound('The store can not be found'));

            req.store = store;
            next();
        }).catch(function(ex) {
            next(new NotFound('The store can not be found'));
        });
}
