angular.module('aladdin.products')
	.factory('productService', ProductService);


function ProductService(httpClient, storeService, util) {

	var service = {
		getById: getById,
		find: find
	};

	return service;

	function getById(id) {

		var url = util.join('stores', storeService.currentStore.id, 'products', id);
		return httpClient.get(url)
			.then(function(res) {
				return res.data;
			});
	}

	function find(searchText) {
		var url = util.join('stores', storeService.currentStore.id, 'products') + '?search=' + searchText;

		return httpClient.get(url)
			.then(function(res) {
				return res.data;
			});
	}
}
