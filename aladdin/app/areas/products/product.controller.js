angular.module('aladdin.products')
	.controller('ProductController', ProductController);

function ProductController(product) {

	var vm = angular.extend(this, {
		product: product
	});
}
