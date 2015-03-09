angular.module('qarin')
	.controller('TicketController', TicketController);

function TicketController($scope, ticket, ticketService, $state) {

	var vm = angular.extend(this, {
		ticket: ticket,
		cancel: cancelRequest
	});

	var unbind = ticketService.on('task:assigned', function(data){
		console.log('task:assigned', data);
	});

	$scope.$on('$destroy', function(){
		console.log('ticket.controller - destroy');
		unbind();
	});

	function cancelRequest(){
		return ticketService.cancel(vm.ticket)
		.then(function(ret){
			console.log('your ticket has been cancelled.');
			$state.go('home');
		});
	}
}
