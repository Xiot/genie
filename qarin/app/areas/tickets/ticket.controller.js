angular.module('qarin')
	.controller('TicketController', TicketController);

function TicketController(ticket, ticketService, $state, socket) {

	var vm = angular.extend(this, {
		ticket: ticket,
		chat: gotoChat
	});

	function gotoChat(){
		return $state.go('chat', {chatId: ticket.chat});
	}

	socket.on('task:assigned', function(data){
		console.log('task:assigned', data);
	});
}