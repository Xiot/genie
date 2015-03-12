//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Task = mongoose.model('Task');
var Store = mongoose.model('OrganizationLocation');
var Product = mongoose.model('Product');
var Department = mongoose.model('Department');

var Creator = require('./task.creator.es6');

module.exports = {
    init: initialize
}

function initialize(server, config) {

    var route = server.route('/init');

    route.post('/user', function(req, res, next) {

        User.removeAsync()
            .then(function() {

                var admin = new User({
                    firstName: 'Chris',
                    lastName: 'Thomas',
                    username: 'xiot',
                    password: 'my name',
                    email: 'xiotox@gmail.com',
                    role: 'admin'
                });

                return admin.saveAsync();
            })
            .spread(function(user) {

                res.send(user);

            });
    });

    route.post('/tasks', async function(req) {

        var creator = new Creator();
        await creator.init();

        var count = (req.body && parseInt(req.body.count)) || 1;

        var results = [];
        for (var i = 0; i < count; i++) {

            var ticket = await creator.createTicket();
            results.push(ticket);

            var promotedTicket = await creator.cycleTicket(ticket);
            if(promotedTicket) {
                await creator.cycleTicket(promotedTicket);
                results.push(promotedTicket);
            }
        }
        return {count: results.length, tickets: results};
    })


    //server.use('/init', router);
}
