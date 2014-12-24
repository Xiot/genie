angular.module('qarin')
    .controller('HomeController', HomeController);

function HomeController($scope, $http, env, notificationSocket, storeService) {

    $scope.requestHelp = function () {
        //notificationSocket
        notificationSocket.emit('help-requested', {store_id: storeService.current._id});
    };

    $scope.searching = true;
    $scope.searchError = "";

    storeService.getCurrentStore().then(function(store){
        $scope.store = store;
    }).catch(function (ex) {
        $scope.searchError = ex;
    }).finally(function () {
        $scope.searching = false;
    });
};