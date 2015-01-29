angular.module('qarin')
	.controller('OutsideShellController', OutsideShellController);

function OutsideShellController(storeService, storageService, $state) {

	var node = document.createElement('style');
	document.body.appendChild(node);
	window.addStyleString = function(str) {
		node.innerHTML = str;
	};

	var vm = angular.extend(this, {
		setStore: _setStore,
		setStoreUsingLocation: _setStoreUsingLocation,
	});

	function _setStore(id) {		
		return storeService.getById(id)
			.then(function(store) {
				storeService.current = store;
				storageService.set('store', id, true);

				$state.go('home');

				return store;
			});
	}

	function _setStoreUsingLocation() {
		
		storageService.remove('store');
		return storeService.getCurrentStore()
			.then(function(store) {

				$state.go('home');

				return store;
			});
	}
}