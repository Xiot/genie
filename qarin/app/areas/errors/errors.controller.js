angular.module('qarin.errors')
	.controller('ErrorController', ErrorController);

// @ngInject
function ErrorController(errorService, $rootScope) {

	var vm = angular.extend(this, {
		error: errorService.lastError
	});

$rootScope.showSplash = false;

}