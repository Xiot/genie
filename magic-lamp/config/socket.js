var debug = require('debug')('magic-lamp-chat');
//var uuid = require('node-uuid');

var ChatLog = require('../models/ChatLog');

// http://stackoverflow.com/questions/8467784/sending-a-message-to-a-client-via-its-socket-id

function config(io){
    
    io.on('connection', function (socket) {
        debug('finally connected');
    });
    

    var notifications = io.of('/notifications');

    notifications.on('connection', function (socket) {
        debug('connected: ' + socket.id);
        
        socket.on('help-requested', function () {
            debug('help-requested: ' + socket.id);
            socket.emit('help', { message: 'help incoming' });
        });
    });
    

    var chat = io.of('/chat');
    
    var index = 0;
    
    chat.on('connection', function (socket) {
        debug('chat - connected');
        
        socket.data = {name: 'Guest' + ++index}
        
        var log = new ChatLog({ startDate: Date.now() });
        log.save();

        socket.emit('init', { name: socket.data.name });

        socket.on('disconnect', function () {
            debug('disconnected');
        });

        socket.on('chat', function (msg) {
            debug(socket.data.name + ": " + msg);
            
            log.messages.push({
                message: msg,
                user: socket.data.name,
                time: Date.now()
            });
            log.save();

            chat.emit('chat', {
                from: socket.data.name,
                date: Date.now(),
                message: msg
            });
        });

    });

}

module.exports = config;