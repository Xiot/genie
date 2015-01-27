angular.module('aladdin.layout')
	.controller('HeaderController', HeaderController);

/* @ngInject */
function HeaderController(securityService, storeService, eventService, util) {

	var vm = angular.extend(this, {
		message: "Hello Header",
		user: securityService.currentUser(),
		store: storeService.currentStore
	});

	// Object.defineProperty(vm, 'org', {
	// 	get: function(){return storeService.currentOrg;},
	// 	set: function(value){storeService.currentOrg = value;}
	// });

	// Object.defineProperty(vm, 'store', {
	// 	get: function(){return storeService.currentStore;},
	// 	set: function(value){storeService.currentStore = value;}
	// });

	//util.addProperty(vm, 'org');
	//util.addProperty(vm, 'store');

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