angular.module('qarin')
	.factory('storeService', StoreService);


/* @ngInject */
function StoreService(geoLocation, httpClient, $rootScope, storageService) {

	var _current = null;
	var availableEvents = ['storeChanged'];

	var service = {
		getById: _getById,
		getCurrentStore: _getCurrentStore,
		on: _registerListener,
		requestHelp: requestHelp
	};

	Object.defineProperty(service, 'current', {
		get: _get_current,
		set: _set_current,
		enumerable: true
	});

	return service;

	function requestHelp() {
		var request = {
			type: 'request',
			//customer: storageService.get('device'),
		};

		var url = '/stores/' + _current.id + '/tasks';
		return httpClient.post(url, request)
			.then(function(res) {
				return res.data;
			});
	}

	function _get_current() {
		return _current;
	}

	function _set_current(value) {
		_current = value;
		$rootScope.$emit('storeChanged', {
			store: _current
		});
	}

	function _getById(id) {
		return httpClient.get('/stores/' + id)
			.then(function(res) {
				return res.data;
			});
	}

	function _getCurrentStore() {

		var storedStore = storageService.get('store');
		if (storedStore) {

			return _getById(storedStore)
				.then(function(store) {
					_current = store;
					$rootScope.$emit('storeChanged', {
						store: _current
					});
				});
		}

		return geoLocation.getGps()
			.then(function(gps) {

				var params = {
					lat: gps.coords.latitude,
					lng: gps.coords.longitude
				};

				return httpClient.get('/locations', {
						params: params
					})
					.then(function(response) {
						if (response.data.length >= 1) {
							_current = response.data[0];

							$rootScope.$emit('storeChanged', {
								store: _current
							});
						}
						return _current;
					});
			});
	}

	function _registerListener(name, handler) {

		if (availableEvents.indexOf(name) === -1)
			throw new Error('The event \'' + name + '\' is not available on storeService.');

		$rootScope.$on(name, handler);
	}
}