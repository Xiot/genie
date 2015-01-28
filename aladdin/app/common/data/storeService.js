angular.module('aladdin.data')
	.factory('storeService', StoreService);

/* @ngInject */
function StoreService(httpClient, eventService, $q, securityService) {

	var _currentStore;
	var _currentOrg;	

	var service = {
		on: _listen,
		setStoreById: setStoreById,
		getTasks: getTasks
	};

	Object.defineProperty(service, 'currentStore', {
		get: get_currentStore,
		set: set_currentStore
	});

	return service;

	function getTasks(options){
		var url = '/stores/' + service.currentStore.id + '/tasks/open';	

		return httpClient.get(url)
		.then(function(res){
			return res.data;
		});
	}


	function setStoreById(id) {
		return getStoreById(id)
			.then(function(store) {
				service.currentStore = store;
				return store;
			});
	}

	function getStoreById(id) {
		return httpClient.get('/stores/' + id)
			.then(function(res) {
				return res.data;
			});
	}

	function get_currentStore() {
		return _currentStore;
	}

	function set_currentStore(value) {

		if (_currentStore === value)
			return;

		if (_currentStore && value && _currentStore.id == value.id)
			return;

		_currentStore = value;
		eventService.raise('storeChanged', _currentStore);
	}

	function _listen(name, handler) {
		eventService.on(name, handler);
	}
}