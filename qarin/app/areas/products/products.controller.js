angular.module('qarin.products')
.controller('ProductsController', ProductsController);

// @ngInject
function ProductsController(httpClient, storeService){

	var vm = angular.extend(this, {
		products: [],
		query: '',
		search: _search
	});


	function _search(){

		var url = '/stores/' + storeService.current.id + '/products?search=' + vm.query;
		httpClient.get(url)
		.then(function(res){
			vm.products = res.data;
		});
	}

	function _init() {
		var opts = {
			params: {
				store: storeService.current.id
			}
		};

		httpClient.get('/users/me/chats', opts)
			.then(function(res) {
				vm.chats = parse(res.data);
			});
	}

}