angular.module('qarin.products')
.controller('ProductController', ProductController);

// @ngInject
function ProductController(productService, product, $state, chatService, ticketService){

	var vm = angular.extend(this, {
		product: product,
		createTicket: createTicket,
		createChat: _createChat
	});

	function createTicket(){
		ticketService.create(vm.product)
		.then(function(ticket){
			$state.go('chat', {chatId: ticket.chat});
		});
	}

	function _createChat(){

		chatService.create({product: product.id})
		.then(function(chat){
			$state.go('chat', {id: chat._id});
		}).catch(function(ex){
			console.log(ex);
		});
	}
}