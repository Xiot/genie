var debug = require('debug')('magic-lamp-chat');
var uuid = require('node-uuid');

function config(io){
    
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
        debug('connected');
        
        socket.data = {name: 'Guest' + ++index}

        socket.emit('init', { name: socket.data.name });

        socket.on('disconnect', function () {
            debug('disconnected');
        });

        socket.on('chat', function (msg) {
            debug(socket.data.name + ": " + msg);
            chat.emit('chat', {
                from: socket.data.name,
                date: Date.now(),
                message: msg
            });
        });

    });

}

module.exports = config;