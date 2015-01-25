
angular.module('app.sections')
	.provider('sectionManager', sectionManagerProvider);

/* @ngInject */
function sectionManagerProvider($stateProvider, $locationProvider) {

	var config = {
		resolveAlways: {}
	};

	this.configure = function (opts) {
		angular.extend(config, opts);
	};

	$locationProvider.html5Mode(true);


	this.$get = SectionManagerService;

	// @ngInject
	function SectionManagerService($rootScope, $state) {

	    var _sections = [];

		var service = {
			getSections: getSections,
			register: registerSections,
            getModules: getModules
		};

		return service;

		function registerSections(sections) {
			sections.forEach(function (state) {

				if(state.parent === undefined)
					state.parent = 'app-root';

				state.resolve =
					angular.extend(state.resolve || {}, config.resolveAlways);
				$stateProvider.state(state);
				_sections.push(state);
			});
		}

		function getModules() {
		    return $state.get().filter(function (x) {
		        return x.settings && x.settings.module;
		    });
		}

		function getSections() {
		    //return $state.get();
		    return _sections;
		}

	}
}
