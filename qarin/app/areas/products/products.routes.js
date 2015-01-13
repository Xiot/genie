angular.module('qarin.products')
	.config(registerRoutes)

// @ngInject
function registerRoutes($stateProvider){
	$stateProvider.state('search', {
		url: '/search',
		controller: 'ProductsController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/products/search.html'
	});
}