//var express = require('express');
//var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Task = mongoose.model('Task');
var Store = mongoose.model('OrganizationLocation');
//var Prod

module.exports = {
  init: initialize
}

function initialize(server, config) {


  server.post('/init/user', function(req, res, next) {

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

  server.post('/init/tasks', async function(req){
    return null;
  })
  //server.use('/init', router);
}
