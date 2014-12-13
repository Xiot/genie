
angular.module('app.sections', ['ui.router']);

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


	this.$get = SectionManagerService;

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


angular.module('app.logging', []);

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
angular.module('solomon.layout', ['ui.bootstrap']); 
angular.module('solomon',
    [
        'solomon.layout',
        'app.logging',
        'app.sections',
        'solomon.partials'
    ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9yb3V0aW5nL3NlY3Rpb25zLm1vZHVsZS5qcyIsImNvbW1vbi9yb3V0aW5nL3NlY3Rpb25zLm1hbmFnZXIuanMiLCJjb21tb24vbG9nZ2luZy9sb2dnZXIubW9kdWxlLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLnNlcnZpY2UuanMiLCJsYXlvdXQvbGF5b3V0Lm1vZHVsZS5qcyIsInNvbG9tb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLFFBQVEsT0FBTyxnQkFBZ0IsQ0FBQyxjQUFjOztBQ0E5QyxRQUFRLE9BQU87RUFDYixTQUFTLGtCQUFrQjs7O0FBRzdCLFNBQVMsdUJBQXVCLGdCQUFnQixtQkFBbUI7O0NBRWxFLElBQUksU0FBUztFQUNaLGVBQWU7OztDQUdoQixLQUFLLFlBQVksVUFBVSxNQUFNO0VBQ2hDLFFBQVEsT0FBTyxRQUFROzs7Q0FHeEIsa0JBQWtCLFVBQVU7OztDQUc1QixLQUFLLE9BQU87OztDQUdaLFNBQVMsc0JBQXNCLFlBQVksUUFBUTs7OztFQUlsRCxJQUFJLFVBQVU7R0FDYixhQUFhO0dBQ2IsVUFBVTs7O0VBR1gsT0FBTzs7RUFFUCxTQUFTLGdCQUFnQixVQUFVO0dBQ2xDLFNBQVMsUUFBUSxVQUFVLE9BQU87SUFDakMsTUFBTSxPQUFPO0tBQ1osUUFBUSxPQUFPLE1BQU0sT0FBTyxXQUFXLElBQUksT0FBTztJQUNuRCxlQUFlLE1BQU0sTUFBTSxPQUFPLE1BQU07Ozs7RUFJMUMsU0FBUyxjQUFjO0dBQ3RCLE9BQU8sT0FBTzs7Ozs7O3lFQUloQjs7O0FDNUNELFFBQVEsT0FBTyxlQUFlLElBQUk7O0FDQWxDLFFBQVEsT0FBTztLQUNWLFFBQVEsVUFBVTs7O0FBR3ZCLFNBQVMsY0FBYyxNQUFNOztJQUV6QixJQUFJLFVBQVU7UUFDVixNQUFNO1FBQ04sU0FBUztRQUNULE9BQU87UUFDUCxLQUFLOzs7SUFHVCxPQUFPOzs7SUFHUCxTQUFTLEtBQUssU0FBUyxNQUFNO1FBQ3pCLEtBQUssS0FBSyxXQUFXLFNBQVM7OztJQUdsQyxTQUFTLFFBQVEsU0FBUyxNQUFNO1FBQzVCLEtBQUssS0FBSyxjQUFjLFNBQVM7OztJQUdyQyxTQUFTLE1BQU0sU0FBUyxNQUFNO1FBQzFCLEtBQUssTUFBTSxZQUFZLFNBQVM7OztpQ0FFdkM7QUM1QkQsUUFBUSxPQUFPLGtCQUFrQixDQUFDLGlCQUFpQjtBQ0FuRCxRQUFRLE9BQU87SUFDWDtRQUNJO1FBQ0E7UUFDQTtRQUNBO09BQ0QiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnLCBbJ3VpLnJvdXRlciddKTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH1cclxuXHJcblx0dGhpcy5jb25maWd1cmUgPSBmdW5jdGlvbiAob3B0cykge1xyXG5cdFx0YW5ndWxhci5leHRlbmQoY29uZmlnLCBvcHRzKTtcclxuXHR9O1xyXG5cclxuXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XHJcblxyXG5cclxuXHR0aGlzLiRnZXQgPSBTZWN0aW9uTWFuYWdlclNlcnZpY2U7XHJcblxyXG5cdC8vIEBuZ0luamVjdFxyXG5cdGZ1bmN0aW9uIFNlY3Rpb25NYW5hZ2VyU2VydmljZSgkcm9vdFNjb3BlLCAkc3RhdGUpIHtcclxuXHJcblx0XHRcclxuXHJcblx0XHR2YXIgc2VydmljZSA9IHtcclxuXHRcdFx0Z2V0U2VjdGlvbnM6IGdldFNlY3Rpb25zLFxyXG5cdFx0XHRyZWdpc3RlcjogcmVnaXN0ZXJTZWN0aW9uXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbihzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cdFx0XHRcdHN0YXRlLmNvbmZpZy5yZXNvbHZlID1cclxuXHRcdFx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHN0YXRlLmNvbmZpZy5yZXNvbHZlIHx8IHt9LCBjb25maWcucmVzb2x2ZUFsd2F5cyk7XHJcblx0XHRcdFx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoc3RhdGUuc3RhdGUsIHN0YXRlLmNvbmZpZyk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNlY3Rpb25zKCkge1xyXG5cdFx0XHRyZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycsIFtdKTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJylcclxuICAgIC5zZXJ2aWNlKCdsb2dnZXInLCBsb2dnZXJTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBsb2dnZXJTZXJ2aWNlKCRsb2cpIHtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBpbmZvOiBpbmZvLFxyXG4gICAgICAgIHdhcm5pbmc6IHdhcm5pbmcsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgIGxvZzogJGxvZ1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gaW5mbyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdJbmZvOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2FybmluZyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdXQVJOSU5HOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuZXJyb3IoJ0VSUk9SOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbi5sYXlvdXQnLCBbJ3VpLmJvb3RzdHJhcCddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nLFxyXG4gICAgW1xyXG4gICAgICAgICdzb2xvbW9uLmxheW91dCcsXHJcbiAgICAgICAgJ2FwcC5sb2dnaW5nJyxcclxuICAgICAgICAnYXBwLnNlY3Rpb25zJyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscydcclxuICAgIF0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==