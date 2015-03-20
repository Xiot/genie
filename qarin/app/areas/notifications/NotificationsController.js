angular.module('qarin')
.controller('NotificationsController', function ($scope, socket) {

    $scope.current = {};
    //notificationSocket
    socket.on('help', function (data) {
        $scope.current = data;
    });

    socket.on('chat-message', function(data){

    });

    socket.on('ticket:updated', function(data){
        console.log('ticket:updated', data);
    });
});
