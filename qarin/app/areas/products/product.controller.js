angular.module('qarin.products')
.controller('ProductController', ProductController);

// @ngInject
function ProductController(productService, product, $state, chatService){

	var vm = angular.extend(this, {
		product: product,
		createChat: _createChat
	});

	function _createChat(){

		chatService.create({product: product._id})
		.then(function(chat){
			$state.go('chat', {id: chat._id});
		}).catch(function(ex){
			console.log(ex);
		});
	}
}