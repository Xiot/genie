angular.module('app.tasks')
	.run(appRun);

/* @ngInject */
function appRun(sectionManager) {

	sectionManager.register(getStates());

}

function getStates() {
	return [{
		name: 'tickets',
		url: '/tickets',
		controller: 'TaskListController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tasks/tasklist.html',
		settings: {
			module: true,
			order: 3,
			icon: ['glyphicon','glyphicon-tags'],
			displayName: 'tickets'
		}
	},
	{
		name: 'ticket-detail',
		url: '/tickets/:ticketId',
		controller: 'TicketDetailController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tasks/ticket.detail.html',
		resolve: {
			ticket: function($stateParams, ticketService){
				var id = $stateParams.ticketId;
				return ticketService.getById(id);
			}
		}
	}
	];
}
