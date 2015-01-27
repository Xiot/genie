
angular.module('aladdin.dashboard')
    .controller('DashboardController', DashboardController);

// @ngInject
function DashboardController(storeService) {
    
	var vm = angular.extend(this, {
		message: "Hello World",
		store: storeService.currentStore
	});
    
    storeService.on('storeChanged', function(e, store){
    	vm.store = store;
    });

}