angular.module('qarin.products')
	.factory('productService', ProductService);

function ProductService(httpClient, storeService) {

	var service = {
		get: _getProductById
	};

	return service;

	function _getProductById(id) {

		return httpClient.get('/stores/' + storeService.current.id + '/products/' + id)
			.then(function(res) {
				return res.data;
			});
	}
}