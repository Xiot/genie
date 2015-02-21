var mongoose = require('mongoose');

var Organization = mongoose.model('Organization');
var Store = mongoose.model('OrganizationLocation');

var debug = require('debug')('magic-lamp-org');

module.exports = function(server, passport) {

    server.get('/organizations', function(req, res, next) {

        Organization.findAsync()
            .then(function(orgs) {
                res.send(orgs);
                next();
            }).catch(function(ex) {
                next(ex);
            });
    });

    server.get('/organizations/:org_id', [idParser,
        function(req, res, next) {
            res.send(req.org);
            next();
        }
    ]);

    server.get('/organizations/:org_id/stores', idParser, function(req, res, next){
        var orgId = req.org.id;

        Store.findAsync({organization: orgId})
        .then(function(stores){

            var ret = stores.map(function(store){
                var s = store.toObject();
                s.id = s._id;
                delete s._id;
                s.href = server.router.render('store.get',{store_id: store.id});
                return s;
            })

            //debug(ret);
            res.send(ret);
            next();
        }).catch(function(ex){
            next(ex);
        });

    });
 
    return server;
}

function idParser(req, res, next) {
    var id = req.params.org_id;

    if(!id || id === 'undefined')
        return next(new Error('id was not specified.'));

    var orgSearch = isObjectId(id) ? Organization.findByIdAsync(id) : Organization.findOneAsync({
        alias: id
    });

    orgSearch
        .then(function(x) {
            req.org = x;
            next();
        }).catch(function(ex) {
            next(ex);
        });
}

function isObjectId(n) {
    return mongoose.Types.ObjectId.isValid(n);
}