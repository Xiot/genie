angular.module('qarin.home')
    .controller('HomeController', HomeController);

function HomeController($scope, $http, env, socket, storeService) {

    var vm = angular.extend(this, {
        store: storeService.current,
        requestHelp: _requestHelp
    });

    function _requestHelp() { 
        return storeService.requestHelp();
    };

    storeService.on('storeChanged', function(e, args){
        vm.store = args.store;
    });
}