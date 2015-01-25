angular.module('qarin.home')
	.config(configureRoutes);

/* @ngInject */
function configureRoutes($stateProvider) {

	$stateProvider
		.state('home', {
			url: '/',
			parent: 'layout',
			templateUrl: 'app/areas/home/home.html',
			controller: 'HomeController',
			controllerAs: 'vm'
		});
}