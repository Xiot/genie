angular.module('qarin')
	.controller('HeaderController', HeaderController);

function HeaderController(storeService, socket, $state) {

	var vm = angular.extend(this, {
		store: storeService.current,
		notifications: []
	});

	socket.on('message', function(data){

		var notification = {
			name: 'message',
			data: data,
			go: function(){
				$state.go('chat({id: data.chat})');
			}
		};
		vm.notifications.unshift(notification);

	});

	storeService.on('storeChanged', function(e, args) {
		vm.store = args.store;
	});

	socket.on('ticket:updated', function(data){
		console.log('ticket:updated', data);

		vm.notifications.push({
			type: 'ticket',
			timestamp: Date.now(),
			viewed: false,
			status: 'updated',
			message: 'ticket was updated',
			action: function(){
				$state.go('ticket-info', {ticketId: data.id})
			}
		});
	});

	vm.notifications.push({
		type: 'ticket',
		timestamp: Date.now(),
		viewed: 'false',
		status: 'updated',
		message: 'ticket was updated',
		action: function(){}
	});
}
