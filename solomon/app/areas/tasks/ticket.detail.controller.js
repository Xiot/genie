angular.module('app.tasks')
.controller('TicketDetailController', TicketDetailController);

function TicketDetailController(ticket){

	var vm = angular.extend(this, {
		ticket: ticket
	});

}