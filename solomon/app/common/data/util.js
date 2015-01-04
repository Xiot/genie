angular.module('app.data')
	.factory('util', UtilService);

function UtilService(eventService) {

	var service = {
		addProperty: addProperty
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
					value: value,
					originalValue: oldValue
				});
			};
		}
	}
}