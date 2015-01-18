
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
mongoose.connect('mongodb://genie:solomon@htpc/genie');
//mongoose.connect('mongodb://genie:solomon@symbiotesoftware.com:17027/genie');
var gfs = grid(mongoose);

module.exports = {
//    app: app,
//    server: server,
//    io: io,
    mongoose: mongoose,
    grid: gfs
};