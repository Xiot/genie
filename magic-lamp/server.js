﻿//#!/usr/bin/env node

var mod = require('getmod');
mod.mark({'~':'.'});
global.load = mod;

var debug = require('debug')('magic-lamp');
var app = require('./app');

// Should pull from config
app.set('port', 3000 || process.env.PORT || 3000);

var server = app.run(app.get('port'), function() {
    debug('Express server listening on port ' + app.get('port'));
});

/*
var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});
*/