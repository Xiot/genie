
angular.module('app.sections')
	.provider('sectionManager', sectionManagerProvider);

/* @ngInject */
function sectionManagerProvider($stateProvider, $locationProvider) {

	var config = {
		resolveAlways: {}
	}

	this.configure = function (opts) {
		angular.extend(config, opts);
	};


	$locationProvider.html5Mode(true);


	this.$get = sectionManagerService;

	// @ngInject
	function SectionManagerService($rootScope, $state) {

		

		var service = {
			getSections: getSections,
			register: registerSection
		};

		return service;

		function registerSection(sections) {
			sections.forEach(function (state) {
				state.config.resolve =
					angular.extend(state.config.resolve || {}, config.resolveAlways);
				$stateProvider.state(state.state, state.config);
			});
		}

		function getSections() {
			return $state.get();
		}

	}
}
