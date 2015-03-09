angular.module('qarin.tickets')
.controller('MyTicketsController', MyTicketsController);


function MyTicketsController(ticketService) {

    var vm = angular.extend(this, {
        openTickets: []
    });


    init();

    function init(){

        ticketService.getOpen()
        .then(function(tickets){
            vm.openTickets = tickets;
        });
    }
}
