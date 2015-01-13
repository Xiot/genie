angular.module('qarin')
	.controller('HeaderController', HeaderController);

function HeaderController(storeService) {

	var vm = angular.extend(this, {
		store: storeService.current
	});

	storeService.on('storeChanged', function(e, args) {
		vm.store = args.store;
	});
}