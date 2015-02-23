angular.module('aladdin.products')
	.run(configureRoutes);

function configureRoutes(sectionManager) {
	sectionManager.register(getStates());
}

function getStates() {
	return [{
		name: 'search-root',
		abstract: true,
		url: '/products',
		controller: 'SearchController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/search.html'
	}, {
		name: 'search',
		url: '?search',
		parent: 'search-root',
		settings: {
			module: true,
			order: 2,
			icon: ['glyphicon', 'glyphicon-search'],
			displayName: 'Products'
		}
	}, {
		name: 'product',
		url: '/products/:productId',
		controller: 'ProductController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/product.html',
		resolve: {
			product: function(productService, $stateParams) {
				var id = $stateParams.productId;
				return productService.getById(id);
			}
		}
	}];
}