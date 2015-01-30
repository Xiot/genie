angular.module('aladdin.layout')
	.controller('HeaderController', HeaderController);

/* @ngInject */
function HeaderController(securityService, storeService, eventService, util) {

	var vm = angular.extend(this, {
		message: "Hello Header",
		user: securityService.currentUser(),
		store: storeService.currentStore
	});

	init();

	function init() {
		securityService.requestCurrentUser()
			.then(function(x) {
				vm.user = x;
			}); 

		securityService.on('userChanged', handleUserChanged);

		storeService.on('storeChanged', function(e, store){
			vm.store = store;
		});
	}

	function handleUserChanged(user) {
		vm.user = user;
	}
}