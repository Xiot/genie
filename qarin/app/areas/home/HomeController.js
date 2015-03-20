angular.module('qarin.home')
    .controller('HomeController', HomeController);

function HomeController($scope, $http, env, socket, storeService, ticketService, $state) {

    var vm = angular.extend(this, {
        store: storeService.current,
        requestHelp: _requestHelp
    });

    function _requestHelp() {
        //return storeService.requestHelp();

        return ticketService.requestAssociate()
        .then(function(ticket){
            return $state.go('ticket-created', {ticketId: ticket.id});
        });
    }

    storeService.on('storeChanged', function(e, args){
        vm.store = args.store;
    });
}
