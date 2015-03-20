
var config = require('./config.js');
var mongoose = require('mongoose');
//var express = require('express');
//var http = require('http');
var bluebird = require('bluebird');
var grid = require('./gridfs');

//var app = express();
//var server = http.createServer(app);
//var io = require('socket.io').listen(server);

bluebird.promisifyAll(mongoose);

// Should get location and credentials from config
var mongoUrl = 'mongodb://genie:solomon@htpc/genie';
mongoose.connect(mongoUrl, {server: {auto_reconnect: true}},  function(err){
    if(err){
        console.error('Failed to connect to mongo. ', err);
    }
});

mongoose.connection.on('error', function(err){
    console.error('mongoose connection failed. ', err);
});

mongoose.connection.on('disconnected', function(){
    console.log('mongoose disconnected.');
})


//mongoose.connect('mongodb://genie:solomon@symbiotesoftware.com:17027/genie');
var gfs = grid(mongoose);

module.exports = {
//    app: app,
//    server: server,
//    io: io,
    mongoose: mongoose,
    grid: gfs
};
