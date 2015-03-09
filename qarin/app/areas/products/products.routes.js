angular.module('qarin.products')
	.config(registerRoutes);

// @ngInject
function registerRoutes($stateProvider){
	$stateProvider.state('search', {
		url: '/search?query&department',
		controller: 'SearchController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/search.html',
		resolve: {
			query: function($stateParams){
				return $stateParams.query;
			},
			department: function($stateParams, storeService){
				if(!$stateParams.department)
					return null;

				return storeService.getDepartment($stateParams.department);
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
