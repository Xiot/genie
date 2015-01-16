angular.module('qarin')
.controller('NotificationsController', function ($scope, socket) {

    $scope.current = {};
    //notificationSocket
    socket.on('help', function (data) {
        $scope.current = data;
    });

    socket.on('chat-message', function(data){

    });
});