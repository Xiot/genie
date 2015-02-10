angular.module('app.data')
	.factory('storeService', StoreService);

/* @ngInject */
function StoreService(httpClient, eventService, $q, storageService) {

	var _currentStore;
	var _currentOrg;

	var service = {
		getOrgs: getOrgs,
		getStores: getStores,
		on: _listen,
		setStoreById: setStoreById
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
				
				var orgId = storageService.get('org');
				if(orgId) {
					service.currentOrg = _.find(res.data, {_id: orgId});
				}

				return res.data;
			});
	}

	function getStores(org) {

		if(!org || !org._id)
			return $q.when([]);

		return httpClient.get('/organizations/' + org._id + '/stores')
			.then(function(res) {
				
				var storeId = storageService.get('store');
				if(storeId)
					service.currentStore = _.find(res.data, {id: storeId});

				return res.data;
			});
	}


	function setStoreById(id) {
		return getStoreById(id)
			.then(function(store) {
				service.currentStore = store;
				service.currentOrg = store.organization;
				return store;
			});
	}

	function getStoreById(id) {
		return httpClient.get('/stores/' + id)
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
		storageService.set('org', _currentOrg._id);
		eventService.raise('orgChanged', _currentOrg);
	}

	function get_currentStore() {
		return _currentStore;
	}

	function set_currentStore(value) {

		if (_currentStore === value)
			return;

		if(_currentStore && value && _currentStore.id == value.id)
			return;

		_currentStore = value;

		var id = _currentStore && _currentStore.id;
		storageService.set('store', id);
		
		console.log('storeChanged', _currentStore);
		eventService.raise('storeChanged', _currentStore);
	}

	function _listen(name, handler){
		eventService.on(name, handler);
	}
}