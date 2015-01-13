angular.module('qarin.home')
    .controller('HomeController', HomeController);

function HomeController($scope, $http, env, socket, storeService) {

    var vm = angular.extend(this, {
        store: storeService.current,
        requestHelp: _requestHelp
    });

    function _requestHelp() {
        socket.emit('help-requested', {store_id: storeService.current._id});
    };

    storeService.on('storeChanged', function(e, args){
        vm.store = args.store;
    });
}