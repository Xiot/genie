
var config = require('./config.js');
var mongoose = require('mongoose');
var express = require('express');
var http = require('http');
var bluebird = require('bluebird');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

bluebird.promisifyAll(mongoose);

// Should get location and credentials from config
mongoose.connect('mongodb://localhost/genie');


module.exports = {
    app: app,
    server: server,
    io: io,
    mongoose: mongoose
};