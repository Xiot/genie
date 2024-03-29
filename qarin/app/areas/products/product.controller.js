angular.module('qarin.products')
.controller('ProductController', ProductController);

// @ngInject
function ProductController(productService, product, $state, chatService, ticketService){

	var vm = angular.extend(this, {
		product: product,
		details: {},
		createChat: _createChat,
		callAssociate: _callAssociate
	});

	function _createChat(){

		ticketService.create({
			product: product.id,
			type: 'chat',
			productDetails: vm.details
		})
		.then(function(ticket){
			$state.go('chat', {chatId: ticket.chat});
		}).catch(function(ex){
			console.log(ex);
		});
	}

	function _callAssociate(){
		ticketService.create({
			product: vm.product,
			type: 'call-associate',
			productDetails: vm.details
		})
		.then(function(ticket){
			$state.go('ticket-created', {ticketId: ticket.id});
		});
	}
}
