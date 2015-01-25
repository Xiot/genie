angular.module('app.layout')
	.controller('HeaderController', HeaderController);

/* @ngInject */
function HeaderController(securityService, storeService, eventService, util) {

	var vm = angular.extend(this, {
		message: "Hello Header",
		user: securityService.currentUser,
		orgs: [],
		stores: []
	});

	Object.defineProperty(vm, 'org', {
		get: function(){return storeService.currentOrg;},
		set: function(value){storeService.currentOrg = value;}
	});

	Object.defineProperty(vm, 'store', {
		get: function(){return storeService.currentStore;},
		set: function(value){storeService.currentStore = value;}
	});

	//util.addProperty(vm, 'org');
	//util.addProperty(vm, 'store');

	init();

	function init() {
		securityService.requestCurrentUser()
			.then(function(x) {
				vm.user = x;
			});

		securityService.on('userChanged', handleUserChanged);

		storeService.getOrgs()
		.then(function(orgs){
			vm.orgs = orgs;
			storeService.currentOrg = vm.orgs[0];
			refreshStores(vm.orgs[0]);
		});

		eventService.on('orgChanged', function(e, org){
			//vm.org = org;
			refreshStores(org);
			
		});

	}

	function refreshStores(org){
		return storeService.getStores(org)
			.then(function(stores){
				vm.stores = stores;
				storeService.currentStore = vm.stores[0];
			});
	}

	function handleUserChanged(user) {
		vm.user = user;
	}
}