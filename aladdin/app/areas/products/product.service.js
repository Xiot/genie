angular.module('aladdin.products')
	.factory('productService', ProductService);


function ProductService(httpClient, storeService) {

	var service = {
		getById: getById
	};

	return service;

	function getById(id) {

		var url = join('stores', storeService.currentStore.id, 'products', id);
		return httpClient.get(url)
			.then(function(res) {
				return res.data;
			});

	}

	function join() {
		var args = [].slice.call(arguments);
		return '/' + args.join('/');
	}
}