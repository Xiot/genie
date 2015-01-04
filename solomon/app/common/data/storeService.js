angular.module('app.data')
	.factory('storeService', StoreService);

/* @ngInject */
function StoreService(httpClient, eventService, $q) {

	var _currentStore;
	var _currentOrg;

	var service = {
		getOrgs: getOrgs,
		getStores: getStores,
	};

	Object.defineProperty(service, 'currentOrg', {
		enumerable: true,
		get: get_currentOrg,
		set: set_currentOrg
	});

	Object.defineProperty(service, 'currentStore', {
		get: get_currentStore,
		set: set_currentStore
	});

	return service;

	function getOrgs() {
		return httpClient.get('/organizations')
			.then(function(res) {
				return res.data;
			});
	}

	function getStores(org) {

		if(!org || !org._id)
			return $q.when([]);

		return httpClient.get('/organizations/' + org._id + '/stores')
			.then(function(res) {
				return res.data;
			});
	}

	function get_currentOrg() {
		return _currentOrg;
	}

	function set_currentOrg(value) {

		if (_currentOrg === value)
			return;

		_currentOrg = value;
		eventService.raise('orgChanged', _currentOrg);
	}

	function get_currentStore() {
		return _currentStore;
	}

	function set_currentStore(value) {

		if (_currentStore === value)
			return;

		_currentStore = value;
		eventService.raise('storeChanged', _currentStore);
	}
}