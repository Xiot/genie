angular.module('aladdin.data')
	.factory('util', UtilService);

function UtilService(eventService) {

	var service = {
		addProperty: addProperty,
		uuid: generateUUID
	};

	return service;

	function addProperty(obj, name, getter, setter) {


		Object.defineProperty(obj, name, {
			get: getter || createGetter(obj, name),
			set: setter || createSetter(obj, name)
		});

		function createGetter(obj, name) {
			var field = '_' + name;
			return function() {
				return obj[field];
			};
		}

		function createSetter(obj, name) {
			var field = '_' + name;
			return function(value) {

				var oldValue = obj[field];

				obj[field] = value;
				eventService.raise(name + 'Changed', {
					obj: obj,
					property: name,
					value: value,
					originalValue: oldValue
				});
			};
		}
	}

	function generateUUID() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	}
}