angular.module('qarin')
.controller('HomeController', function ($scope, $http, env) {

    $scope.requestHelp = function () {
        //notificationSocket
        //notificationSocket.emit('help-requested', {});
    };

    $http.get(env.apiRoot)
    .then(function (x) {
        $scope.data = x.data;
    });

});