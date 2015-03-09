angular.module('qarin')
.config(configureRoutes);

function configureRoutes($stateProvider){

	$stateProvider
	.state('my-tickets', {
		url: '/tickets',
		controller: 'MyTicketsController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tickets/my-tickets.html'
	})
	.state('ticket-info', {
		url: '/tickets/:ticketId',
		controller: 'TicketController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tickets/ticket-details.html',
		resolve: {
			ticket: function(ticketService, $stateParams){
				var id = $stateParams.ticketId;
				return ticketService.get(id);
			}
		}
	})
	.state('ticket-created', {
		url: '/tickets/:ticketId/created',
		controller: 'TicketController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tickets/ticket-created.html',
		resolve: {
			ticket: function(ticketService, $stateParams){
				var id = $stateParams.ticketId;
				return ticketService.get(id);
			}
		}
	});

}
