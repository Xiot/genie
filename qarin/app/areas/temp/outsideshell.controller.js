angular.module('qarin')
	.controller('OutsideShellController', OutsideShellController);

function OutsideShellController(storeService, storageService) {

	var node = document.createElement('style');
	document.body.appendChild(node);
	window.addStyleString = function(str) {
		node.innerHTML = str;
	}

	var vm = angular.extend(this, {
		setStore: _setStore,
		setStoreUsingLocation: _setStoreUsingLocation,

		themeOne: function() {
			node.innerHTML = ".device-root {background-color: white}";
		},
		themeTwo: function() {
			node.innerHTML = ".device-root {background-color: green}";
		}
	});

	function _setStore(id) {		
		return storeService.getById(id)
			.then(function(store) {
				storeService.current = store;
				storageService.set('store', id, true);
				return store;
			});
	}

	function _setStoreUsingLocation() {
		
		storeService.remove('store');
		return storeService.getCurrentStore()
			.then(function(store) {
				return store;
			});
	}
}