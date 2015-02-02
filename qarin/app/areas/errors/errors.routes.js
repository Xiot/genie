angular.module('qarin.errors')
	.config(configureRoutes);

function configureRoutes($stateProvider){
	$stateProvider.state('error', {
		url: '/error',
		parent: 'root',
		controller: 'ErrorController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/errors/error.html'
	});
}