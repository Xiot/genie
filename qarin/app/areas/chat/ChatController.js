
angular.module('qarin')
.controller('ChatController', function (chatSocket) {

    var me = this;

    chatSocket.on('init', function (data) {
        me.name = data.name;
    })

    chatSocket.on('chat', function (msg) {
        me.messages.push(msg);
    })
    this.messages = [];

    this.name = "";
    this.message = "";
    this.send = function () {
        chatSocket.emit('chat', this.message);
    }

});