(function () {
    'use strict';
    angular.module('app.sections', ['ui.router']);
    angular.module('app.sections').run(debugRoutes);
    /* @ngInject */
    function debugRoutes($rootScope, $state, $stateParams) {
        // Credits: Adam's answer in http://stackoverflow.com/a/20786262/69362
        // Paste this in browser's console
        //var $rootScope = angular.element(document.querySelectorAll("[ui-view]")[0]).injector().get('$rootScope');
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
        });
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
            console.log('$stateChangeError - fired when an error occurs during transition.');
            console.log(arguments);
        });
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
        });
        $rootScope.$on('$viewContentLoaded', function (event) {
            console.log('$viewContentLoaded - fired after dom rendered', event);
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
            console.log(unfoundState, fromState, fromParams);
        });
    }
    debugRoutes.$inject = ["$rootScope", "$state", "$stateParams"];
}());
(function () {
    'use strict';
    angular.module('app.sections').provider('sectionManager', sectionManagerProvider);
    /* @ngInject */
    function sectionManagerProvider($stateProvider, $locationProvider) {
        var config = { resolveAlways: {} };
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
                    state.resolve = angular.extend(state.resolve || {}, config.resolveAlways);
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
        SectionManagerService.$inject = ["$rootScope", "$state"];
    }
    sectionManagerProvider.$inject = ["$stateProvider", "$locationProvider"];
}());
(function () {
    'use strict';
    angular.module('app.logging', []);
}());
(function () {
    'use strict';
    angular.module('app.logging').service('logger', loggerService);
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
}());
(function () {
    'use strict';
    angular.module('app.dashboard', ['app.sections']).run(appRun);
    //.config(function ($stateProvider) {
    //    $stateProvider.state('root', {
    //        url: '',
    //        abstract: true,
    //        template: '<div ui-view></div>'
    //    });
    //    $stateProvider.state('dashboard', {
    //        url: '',
    //        parent: 'root',
    //        controller: 'DashboardController',
    //        controllerAs: 'vm',
    //        templateUrl: 'app/areas/dashboard/dashboard.html'
    //    });
    //});
    function appRun(sectionManager) {
        sectionManager.register(getStates());
    }
    appRun.$inject = ["sectionManager"];
    function getStates() {
        return [{
                name: 'dashboard',
                url: '',
                controller: 'DashboardController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/dashboard/dashboard.html',
                settings: {
                    module: true,
                    order: 1
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.dashboard').controller('DashboardController', DashboardController);
    // @ngInject
    function DashboardController() {
        this.message = 'Hello World';
    }
}());
(function () {
    'use strict';
    angular.module('app.layout', ['ui.bootstrap']);
}());
(function () {
    'use strict';
    angular.module('app.layout').controller('ShellController', ShellController);
    /* @ngInject */
    function ShellController(sectionManager) {
        var vm = this;
        vm.sections = sectionManager.getModules();
    }
    ShellController.$inject = ["sectionManager"];
}());
(function () {
    'use strict';
    angular.module('solomon', [
        'app.layout',
        'app.logging',
        'app.sections',
        'solomon.partials',
        'app.dashboard'
    ]);
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9yb3V0aW5nL3NlY3Rpb25zLm1vZHVsZS5qcyIsImNvbW1vbi9yb3V0aW5nL3NlY3Rpb25zLm1hbmFnZXIuanMiLCJjb21tb24vbG9nZ2luZy9sb2dnZXIubW9kdWxlLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLnNlcnZpY2UuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwibGF5b3V0L3NoZWxsLmNvbnRyb2xsZXIuanMiLCJzb2xvbW9uLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJydW4iLCJkZWJ1Z1JvdXRlcyIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkc3RhdGVQYXJhbXMiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJhcmd1bWVudHMiLCJuYW1lIiwidW5mb3VuZFN0YXRlIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsInNlcnZpY2UiLCJnZXRTZWN0aW9ucyIsInJlZ2lzdGVyIiwicmVnaXN0ZXJTZWN0aW9ucyIsImdldE1vZHVsZXMiLCJzZWN0aW9ucyIsImZvckVhY2giLCJzdGF0ZSIsInJlc29sdmUiLCJwdXNoIiwiZ2V0IiwiZmlsdGVyIiwieCIsInNldHRpbmdzIiwibG9nZ2VyU2VydmljZSIsIiRsb2ciLCJpbmZvIiwid2FybmluZyIsImVycm9yIiwibWVzc2FnZSIsImRhdGEiLCJhcHBSdW4iLCJzZWN0aW9uTWFuYWdlciIsImdldFN0YXRlcyIsInVybCIsImNvbnRyb2xsZXIiLCJjb250cm9sbGVyQXMiLCJ0ZW1wbGF0ZVVybCIsIm9yZGVyIiwiRGFzaGJvYXJkQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsInZtIl0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQUFKQSxRQUFRQyxPQUFPLGdCQUFnQixDQUFDO0lBR2hDRCxRQUFRQyxPQUFPLGdCQUFnQkMsSUFBSUM7O0lBR25DLFNBQVNBLFlBQVlDLFlBQVlDLFFBQVFDLGNBQWM7Ozs7UUFNbkRGLFdBQVdDLFNBQVNBO1FBQ3BCRCxXQUFXRSxlQUFlQTtRQUUxQkYsV0FBV0csSUFBSSxxQkFBcUIsVUFBVUMsT0FBT0MsU0FBU0MsVUFBVUMsV0FBV0MsWUFBWTtZQUMzRkMsUUFBUUMsSUFBSSwwQkFBMEJMLFFBQVFNLEtBQUssNkRBQTZETixTQUFTQzs7UUFHN0hOLFdBQVdHLElBQUkscUJBQXFCLFVBQVVDLE9BQU9DLFNBQVNDLFVBQVVDLFdBQVdDLFlBQVk7WUFDM0ZDLFFBQVFDLElBQUk7WUFDWkQsUUFBUUMsSUFBSUU7O1FBR2hCWixXQUFXRyxJQUFJLHVCQUF1QixVQUFVQyxPQUFPQyxTQUFTQyxVQUFVQyxXQUFXQyxZQUFZO1lBQzdGQyxRQUFRQyxJQUFJLDRCQUE0QkwsUUFBUVEsT0FBTzs7UUFHM0RiLFdBQVdHLElBQUksc0JBQXNCLFVBQVVDLE9BQU87WUFDbERLLFFBQVFDLElBQUksaURBQWlETjs7UUFHakVKLFdBQVdHLElBQUksa0JBQWtCLFVBQVVDLE9BQU9VLGNBQWNQLFdBQVdDLFlBQVk7WUFDbkZDLFFBQVFDLElBQUksb0JBQW9CSSxhQUFhSCxLQUFLO1lBQ2xERixRQUFRQyxJQUFJSSxjQUFjUCxXQUFXQzs7OztLQU54QztBQzdCTCxDQUFDLFlBQVk7SUFDVDtJQUFKWixRQUFRQyxPQUFPLGdCQUNia0IsU0FBUyxrQkFBa0JDOztJQUc3QixTQUFTQSx1QkFBdUJDLGdCQUFnQkMsbUJBQW1CO1FBRWxFLElBQUlDLFNBQVMsRUFDWkMsZUFBZTtRQUdoQixLQUFLQyxZQUFZLFVBQVVDLE1BQU07WUFDaEMxQixRQUFRMkIsT0FBT0osUUFBUUc7O1FBR3hCSixrQkFBa0JNLFVBQVU7UUFHNUIsS0FBS0MsT0FBT0M7O1FBR1osU0FBU0Esc0JBQXNCMUIsWUFBWUMsUUFBUTtZQUUvQyxJQUFJMEIsWUFBWTtZQUVuQixJQUFJQyxVQUFVO2dCQUNiQyxhQUFhQTtnQkFDYkMsVUFBVUM7Z0JBQ0RDLFlBQVlBOztZQUd0QixPQUFPSjtZQUVQLFNBQVNHLGlCQUFpQkUsVUFBVTtnQkFDbkNBLFNBQVNDLFFBQVEsVUFBVUMsT0FBTztvQkFDakNBLE1BQU1DLFVBQ0x4QyxRQUFRMkIsT0FBT1ksTUFBTUMsV0FBVyxJQUFJakIsT0FBT0M7b0JBQzVDSCxlQUFla0IsTUFBTUE7b0JBQ3JCUixVQUFVVSxLQUFLRjs7O1lBSWpCLFNBQVNILGFBQWE7Z0JBQ2xCLE9BQU8vQixPQUFPcUMsTUFBTUMsT0FBTyxVQUFVQyxHQUFHO29CQUNwQyxPQUFPQSxFQUFFQyxZQUFZRCxFQUFFQyxTQUFTNUM7OztZQUl4QyxTQUFTZ0MsY0FBYzs7Z0JBRW5CLE9BQU9GOzs7Ozs7S0FaUjtBQ3RDTCxDQUFDLFlBQVk7SUFDVDtJQUFKL0IsUUFBUUMsT0FBTyxlQUFlO0tBRXpCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFBSkQsUUFBUUMsT0FBTyxlQUNWK0IsUUFBUSxVQUFVYzs7SUFHdkIsU0FBU0EsY0FBY0MsTUFBTTtRQUV6QixJQUFJZixVQUFVO1lBQ1ZnQixNQUFNQTtZQUNOQyxTQUFTQTtZQUNUQyxPQUFPQTtZQUNQcEMsS0FBS2lDOztRQUdULE9BQU9mO1FBR1AsU0FBU2dCLEtBQUtHLFNBQVNDLE1BQU07WUFDekJMLEtBQUtDLEtBQUssV0FBV0csU0FBU0M7O1FBR2xDLFNBQVNILFFBQVFFLFNBQVNDLE1BQU07WUFDNUJMLEtBQUtDLEtBQUssY0FBY0csU0FBU0M7O1FBR3JDLFNBQVNGLE1BQU1DLFNBQVNDLE1BQU07WUFDMUJMLEtBQUtHLE1BQU0sWUFBWUMsU0FBU0M7Ozs7S0FKbkM7QUN0QkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESnBELFFBQVFDLE9BQU8saUJBQWlCLENBQUMsaUJBQzVCQyxJQUFJbUQ7Ozs7Ozs7Ozs7Ozs7OztJQW1CVCxTQUFTQSxPQUFPQyxnQkFBZ0I7UUFFNUJBLGVBQWVwQixTQUFTcUI7OztJQUk1QixTQUFTQSxZQUFZO1FBQ2pCLE9BQU8sQ0FDSDtnQkFDSXRDLE1BQU07Z0JBQ051QyxLQUFLO2dCQUNMQyxZQUFZO2dCQUNaQyxjQUFjO2dCQUNkQyxhQUFhO2dCQUNiZCxVQUFVO29CQUNONUMsUUFBUTtvQkFDUjJELE9BQU87Ozs7S0FIbEI7QUNqQ0wsQ0FBQyxZQUFZO0lBQ1Q7SUFBSjVELFFBQVFDLE9BQU8saUJBQ1Z3RCxXQUFXLHVCQUF1Qkk7O0lBR3ZDLFNBQVNBLHNCQUFzQjtRQUMzQixLQUFLVixVQUFVOztLQUNkO0FDUEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5ELFFBQVFDLE9BQU8sY0FBYyxDQUFDO0tBR3pCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxjQUNWd0QsV0FBVyxtQkFBbUJLOztJQUduQyxTQUFTQSxnQkFBZ0JSLGdCQUFnQjtRQUVyQyxJQUFJUyxLQUFLO1FBQ1RBLEdBQUcxQixXQUFXaUIsZUFBZWxCOzs7S0FDNUI7QUNSTCxDQUFDLFlBQVk7SUFDVDtJQURKcEMsUUFBUUMsT0FBTyxXQUNYO1FBQ0k7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7S0FHSCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycsIFsndWkucm91dGVyJ10pO1xyXG5cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKS5ydW4oZGVidWdSb3V0ZXMpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGRlYnVnUm91dGVzKCRyb290U2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICAvLyBDcmVkaXRzOiBBZGFtJ3MgYW5zd2VyIGluIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIwNzg2MjYyLzY5MzYyXHJcbiAgICAvLyBQYXN0ZSB0aGlzIGluIGJyb3dzZXIncyBjb25zb2xlXHJcblxyXG4gICAgLy92YXIgJHJvb3RTY29wZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW3VpLXZpZXddXCIpWzBdKS5pbmplY3RvcigpLmdldCgnJHJvb3RTY29wZScpO1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG4gICAgJHJvb3RTY29wZS4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN0YXJ0IHRvICcgKyB0b1N0YXRlLnRvICsgJy0gZmlyZWQgd2hlbiB0aGUgdHJhbnNpdGlvbiBiZWdpbnMuIHRvU3RhdGUsdG9QYXJhbXMgOiBcXG4nLCB0b1N0YXRlLCB0b1BhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3VjY2VzcyB0byAnICsgdG9TdGF0ZS5uYW1lICsgJy0gZmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZS4nKTtcclxuICAgIH0pO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHZpZXdDb250ZW50TG9hZGVkIC0gZmlyZWQgYWZ0ZXIgZG9tIHJlbmRlcmVkJywgZXZlbnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVOb3RGb3VuZCAnICsgdW5mb3VuZFN0YXRlLnRvICsgJyAgLSBmaXJlZCB3aGVuIGEgc3RhdGUgY2Fubm90IGJlIGZvdW5kIGJ5IGl0cyBuYW1lLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcclxuICAgIH0pO1xyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKVxyXG5cdC5wcm92aWRlcignc2VjdGlvbk1hbmFnZXInLCBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG5cclxuXHR2YXIgY29uZmlnID0ge1xyXG5cdFx0cmVzb2x2ZUFsd2F5czoge31cclxuXHR9XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5odG1sJyxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiAxXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXNoYm9hcmQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0Rhc2hib2FyZENvbnRyb2xsZXInLCBEYXNoYm9hcmRDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBEYXNoYm9hcmRDb250cm9sbGVyKCkge1xyXG4gICAgdGhpcy5tZXNzYWdlID0gXCJIZWxsbyBXb3JsZFwiO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnLCBbJ3VpLmJvb3RzdHJhcCddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ1NoZWxsQ29udHJvbGxlcicsIFNoZWxsQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU2hlbGxDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgdmFyIHZtID0gdGhpcztcclxuICAgIHZtLnNlY3Rpb25zID0gc2VjdGlvbk1hbmFnZXIuZ2V0TW9kdWxlcygpO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmxheW91dCcsXHJcbiAgICAgICAgJ2FwcC5sb2dnaW5nJyxcclxuICAgICAgICAnYXBwLnNlY3Rpb25zJyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscycsXHJcbiAgICAgICAgJ2FwcC5kYXNoYm9hcmQnXHJcbiAgICBdKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=