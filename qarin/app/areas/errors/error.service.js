angular.module('qarin.errors')
.factory('errorService', ErrorService);

// @ngInject
function ErrorService(){

	var service = {
		lastError: null
	};
	return service;
}