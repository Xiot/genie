angular.module('qarin.products')
	.config(registerRoutes);

// @ngInject
function registerRoutes($stateProvider){
	$stateProvider.state('search', {
		url: '/search?query',
		controller: 'SearchController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/search.html',
		resolve: {
			query: function($stateParams){
				return $stateParams.query;
			}
		}
	})
	.state('product', {
		url: '/product/:productId',
		controller: 'ProductController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/product.html',
		resolve: {
			product: function(productService, $stateParams){
				return productService.get($stateParams.productId);
			}
		}
	});
}