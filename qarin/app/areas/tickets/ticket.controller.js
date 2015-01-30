angular.module('qarin')
	.controller('TicketController', TicketController);

function TicketController($scope, ticket, ticketService, $state) {

	var vm = angular.extend(this, {
		ticket: ticket,
		chat: gotoChat
	});

	function gotoChat(){
		return $state.go('chat', {chatId: ticket.chat});
	}

	var unbind = ticketService.on('task:assigned', function(data){
		console.log('task:assigned', data);
	});

	$scope.$on('$destroy', function(){
		console.log('ticket.controller - destroy');
		unbind();
	});

}