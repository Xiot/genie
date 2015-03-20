angular.module('qarin')
	.factory('deviceManager', DeviceManager);

function DeviceManager(storageService) {

	var service = {
		get: getDeviceId
	};

	return service;

	function getDeviceId() {
		var id = storageService.get('device-id');
		if (id)
			return id;

		id = uuid();
		storageService.set('device-id', id, true);
		return id;
	}

	function uuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
}
