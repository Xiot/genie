(function(){
"use strict";
angular.module('solomon',
    [
        'solomon.layout',
        'app.logging',
        'app.sections'
    ]);
})();
(function(){
"use strict";
angular.module('solomon.layout', []);
})();
(function(){
"use strict";

angular.module('app.logging', []);
})();
(function(){
"use strict";

angular.module('app.logging')
    .service('logger', loggerService);

// @ngInject
function loggerService($log) {

    var service = {
        info: info,
        warning: warning,
        error: error,
        log: $log
    };

    return service;


    function info(message, data) {
        $log.info('Info: ' + message, data);
    }

    function warning(message, data) {
        $log.info('WARNING: ' + message, data);
    }

    function error(message, data) {
        $log.error('ERROR: ' + message, data);
    }
}
loggerService.$inject = ["$log"];
})();
(function(){
"use strict";

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
	SectionManagerService.$inject = ["$rootScope", "$state"];
}
sectionManagerProvider.$inject = ["$stateProvider", "$locationProvider"];

})();
(function(){
"use strict";

angular.module('app.sections', ['ui.router']);
})();