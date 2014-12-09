angular.module('qarin')
.controller('NotificationsController', function ($scope, notificationSocket) {

    $scope.current = {};
    //notificationSocket
    notificationSocket.on('help', function (data) {
        $scope.current = data;
    });
});