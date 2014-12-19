var mongoose = require('mongoose');
var router = require('express').Router();
var storeRoutes = require('express').Router();

var passport = require('passport');

var errors = load('~/core/errors');
var NotFound = errors.NotFound;
var ServerError = errors.ServerError;

var Store = mongoose.model('OrganizationLocation');
var Product = mongoose.model('Product');
var Task = mongoose.model('Task');

module.exports.init = function (app, config) {
    
    storeRoutes.get('/', function (req, res) {
        res.send(req.store);
    });
    
    storeRoutes.get('/products', function (req, res, next) {
        
        Product.findAsync({ store: req.store.id })
        .then(function (products) {
            res.send(products);
        }).catch(function (ex) {
            next(new ServerError(ex));
        });
    });
    
    storeRoutes.get('/tasks', function (req, res, next) {
        
        Task.findAsync({ store: req.store.id })
        .then(function (tasks) {
            res.send(tasks);

        }).catch(function (ex) {
            return next(new ServerError(ex));
        })
    });
    
    storeRoutes.post('/tasks', 
        passport.authenticate('bearer'), 
        function (req, res, next) {
        
        var task = new Task(req.body);
        task.store = req.store;
        task.created_by = req.user;

        task.saveAsync()
        .spread(function (ret) {
            res.send(ret);
        }).catch(function (ex) {

            next(ex);
        });

    });
    
    app.use('/stores/:store_id',         
        storeMiddleware,
        storeRoutes);
    
    app.use('/stores', router);
}

//function 

function storeMiddleware(req, res, next) {
    var storeId = req.params.store_id;
    
    if (!mongoose.Types.ObjectId.isValid(storeId))
        return next(new NotFound('The store can not be found.'));
    
    Store.findByIdAsync(storeId)
    .then(function (store) {
        if (!store)
            return next(new NotFound('The store can not be found'));
        
        req.store = store;
        next();
    }).catch(function (ex) {
        next(new NotFound('The store can not be found'));
    });
}