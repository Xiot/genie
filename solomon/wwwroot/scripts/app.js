(function () {
    'use strict';
    angular.module('app.security', []).factory('securityService', securityService);
    /* @ngInject */
    function securityService(storageService, $state, httpClient, $q) {
        var _currentUser = null;
        var service = {
            requestCurrentUser: _requestCurrentUser,
            login: _login,
            logout: _logout
        };
        return service;
        function _requestCurrentUser() {
            if (_currentUser)
                return $q.when(_currentUser);
            return httpClient.get('/tokens/current').then(function (response) {
            });
        }
        function _login(username, password, persist) {
        }
        function _logout() {
            storageService.remove('token');
            $state.go('login');
        }
    }
    securityService.$inject = ["storageService", "$state", "httpClient", "$q"];
}());
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
    angular.module('app.stores', ['ui.router']).run(appRun);
    /* @ngInject */
    function appRun(sectionManager) {
        sectionManager.register(getStates());
    }
    appRun.$inject = ["sectionManager"];
    function getStates() {
        return [{
                name: 'stores',
                url: '/stores',
                controller: 'StoresController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/stores/stores.html',
                settings: {
                    module: true,
                    order: 2
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.stores').controller('StoresController', StoresController);
    function StoresController(httpClient) {
        var vm = this;
        vm.stores = [];
        vm.selected = null;
        vm.tasks = [];
        vm.select = function (store) {
            vm.selected = store;
            httpClient.get('/stores/' + store._id + '/tasks').then(function (x) {
                vm.tasks = x.data;
            });
        };
        init();
        function init() {
            httpClient.get('/stores').then(function (x) {
                vm.stores = x.data;
            });
        }
    }
    StoresController.$inject = ["httpClient"];
}());
(function () {
    'use strict';
    angular.module('app.layout', [
        'ui.bootstrap',
        'ui.router'
    ]);
}());
(function () {
    'use strict';
    angular.module('app.layout').run(appRun);
    /* @ngInject */
    function appRun(sectionManager) {
        sectionManager.register([]);
    }
    appRun.$inject = ["sectionManager"];
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
    angular.module('app.layout').config(initializeStates);
    /* @ngInject */
    function initializeStates($stateProvider) {
        $stateProvider.state('root', {
            url: '',
            template: '<div ui-view></div>'
        }).state('login', {
            url: '',
            controller: 'LoginController',
            templateUrl: 'app/areas/login/login.html'
        }).state('app-root', {
            url: '',
            controller: 'ShellController',
            templateUrl: 'app/layout/shell.html',
            resolve: {}
        });
    }
    initializeStates.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('solomon', [
        'app.layout',
        'app.logging',
        'app.sections',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'symbiote.common'
    ]);
    angular.module('solomon').config(config);
    /* @ngInject */
    function config(httpClientProvider) {
        httpClientProvider.baseUri = 'http://localhost:3000';
    }
    config.$inject = ["httpClientProvider"];
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwic29sb21vbi5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsInNlY3VyaXR5U2VydmljZSIsInN0b3JhZ2VTZXJ2aWNlIiwiJHN0YXRlIiwiaHR0cENsaWVudCIsIiRxIiwiX2N1cnJlbnRVc2VyIiwic2VydmljZSIsInJlcXVlc3RDdXJyZW50VXNlciIsIl9yZXF1ZXN0Q3VycmVudFVzZXIiLCJsb2dpbiIsIl9sb2dpbiIsImxvZ291dCIsIl9sb2dvdXQiLCJ3aGVuIiwiZ2V0IiwidGhlbiIsInJlc3BvbnNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInBlcnNpc3QiLCJyZW1vdmUiLCJnbyIsInJ1biIsImRlYnVnUm91dGVzIiwiJHJvb3RTY29wZSIsIiRzdGF0ZVBhcmFtcyIsIiRvbiIsImV2ZW50IiwidG9TdGF0ZSIsInRvUGFyYW1zIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImNvbnNvbGUiLCJsb2ciLCJ0byIsImFyZ3VtZW50cyIsIm5hbWUiLCJ1bmZvdW5kU3RhdGUiLCJwcm92aWRlciIsInNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIiLCIkc3RhdGVQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiY29uZmlnIiwicmVzb2x2ZUFsd2F5cyIsImNvbmZpZ3VyZSIsIm9wdHMiLCJleHRlbmQiLCJodG1sNU1vZGUiLCIkZ2V0IiwiU2VjdGlvbk1hbmFnZXJTZXJ2aWNlIiwiX3NlY3Rpb25zIiwiZ2V0U2VjdGlvbnMiLCJyZWdpc3RlciIsInJlZ2lzdGVyU2VjdGlvbnMiLCJnZXRNb2R1bGVzIiwic2VjdGlvbnMiLCJmb3JFYWNoIiwic3RhdGUiLCJyZXNvbHZlIiwicHVzaCIsImZpbHRlciIsIngiLCJzZXR0aW5ncyIsImxvZ2dlclNlcnZpY2UiLCIkbG9nIiwiaW5mbyIsIndhcm5pbmciLCJlcnJvciIsIm1lc3NhZ2UiLCJkYXRhIiwiYXBwUnVuIiwic2VjdGlvbk1hbmFnZXIiLCJnZXRTdGF0ZXMiLCJ1cmwiLCJjb250cm9sbGVyIiwiY29udHJvbGxlckFzIiwidGVtcGxhdGVVcmwiLCJvcmRlciIsIlN0b3Jlc0NvbnRyb2xsZXIiLCJ2bSIsInN0b3JlcyIsInNlbGVjdGVkIiwidGFza3MiLCJzZWxlY3QiLCJzdG9yZSIsIl9pZCIsImluaXQiLCJEYXNoYm9hcmRDb250cm9sbGVyIiwiU2hlbGxDb250cm9sbGVyIiwiaW5pdGlhbGl6ZVN0YXRlcyIsInRlbXBsYXRlIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiYmFzZVVyaSJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxZQUFZO0lBQ1Q7SUFESkEsUUFBUUMsT0FBTyxnQkFBZ0IsSUFDMUJDLFFBQVEsbUJBQW1CQzs7SUFHaEMsU0FBU0EsZ0JBQWdCQyxnQkFBZ0JDLFFBQVFDLFlBQVlDLElBQUk7UUFFN0QsSUFBSUMsZUFBZTtRQUVuQixJQUFJQyxVQUFVO1lBQ1ZDLG9CQUFvQkM7WUFFcEJDLE9BQU9DO1lBQ1BDLFFBQVFDOztRQUdaLE9BQU9OO1FBR1AsU0FBU0Usc0JBQXNCO1lBRTNCLElBQUlIO2dCQUNBLE9BQU9ELEdBQUdTLEtBQUtSO1lBSW5CLE9BQU9GLFdBQVdXLElBQUksbUJBQ3JCQyxLQUFLLFVBQVVDLFVBQVU7OztRQUs5QixTQUFTTixPQUFPTyxVQUFVQyxVQUFVQyxTQUFTOztRQUc3QyxTQUFTUCxVQUFVO1lBQ2ZYLGVBQWVtQixPQUFPO1lBQ3RCbEIsT0FBT21CLEdBQUc7Ozs7S0FYYjtBQ3pCTCxDQUFDLFlBQVk7SUFDVDtJQUFKeEIsUUFBUUMsT0FBTyxnQkFBZ0IsQ0FBQztJQUdoQ0QsUUFBUUMsT0FBTyxnQkFBZ0J3QixJQUFJQzs7SUFHbkMsU0FBU0EsWUFBWUMsWUFBWXRCLFFBQVF1QixjQUFjOzs7O1FBTW5ERCxXQUFXdEIsU0FBU0E7UUFDcEJzQixXQUFXQyxlQUFlQTtRQUUxQkQsV0FBV0UsSUFBSSxxQkFBcUIsVUFBVUMsT0FBT0MsU0FBU0MsVUFBVUMsV0FBV0MsWUFBWTtZQUMzRkMsUUFBUUMsSUFBSSwwQkFBMEJMLFFBQVFNLEtBQUssNkRBQTZETixTQUFTQzs7UUFHN0hMLFdBQVdFLElBQUkscUJBQXFCLFVBQVVDLE9BQU9DLFNBQVNDLFVBQVVDLFdBQVdDLFlBQVk7WUFDM0ZDLFFBQVFDLElBQUk7WUFDWkQsUUFBUUMsSUFBSUU7O1FBR2hCWCxXQUFXRSxJQUFJLHVCQUF1QixVQUFVQyxPQUFPQyxTQUFTQyxVQUFVQyxXQUFXQyxZQUFZO1lBQzdGQyxRQUFRQyxJQUFJLDRCQUE0QkwsUUFBUVEsT0FBTzs7UUFHM0RaLFdBQVdFLElBQUksc0JBQXNCLFVBQVVDLE9BQU87WUFDbERLLFFBQVFDLElBQUksaURBQWlETjs7UUFHakVILFdBQVdFLElBQUksa0JBQWtCLFVBQVVDLE9BQU9VLGNBQWNQLFdBQVdDLFlBQVk7WUFDbkZDLFFBQVFDLElBQUksb0JBQW9CSSxhQUFhSCxLQUFLO1lBQ2xERixRQUFRQyxJQUFJSSxjQUFjUCxXQUFXQzs7OztLQU54QztBQzdCTCxDQUFDLFlBQVk7SUFDVDtJQUFKbEMsUUFBUUMsT0FBTyxnQkFDYndDLFNBQVMsa0JBQWtCQzs7SUFHN0IsU0FBU0EsdUJBQXVCQyxnQkFBZ0JDLG1CQUFtQjtRQUVsRSxJQUFJQyxTQUFTLEVBQ1pDLGVBQWU7UUFHaEIsS0FBS0MsWUFBWSxVQUFVQyxNQUFNO1lBQ2hDaEQsUUFBUWlELE9BQU9KLFFBQVFHOztRQUd4Qkosa0JBQWtCTSxVQUFVO1FBRzVCLEtBQUtDLE9BQU9DOztRQUdaLFNBQVNBLHNCQUFzQnpCLFlBQVl0QixRQUFRO1lBRS9DLElBQUlnRCxZQUFZO1lBRW5CLElBQUk1QyxVQUFVO2dCQUNiNkMsYUFBYUE7Z0JBQ2JDLFVBQVVDO2dCQUNEQyxZQUFZQTs7WUFHdEIsT0FBT2hEO1lBRVAsU0FBUytDLGlCQUFpQkUsVUFBVTtnQkFDbkNBLFNBQVNDLFFBQVEsVUFBVUMsT0FBTztvQkFDakNBLE1BQU1DLFVBQ0w3RCxRQUFRaUQsT0FBT1csTUFBTUMsV0FBVyxJQUFJaEIsT0FBT0M7b0JBQzVDSCxlQUFlaUIsTUFBTUE7b0JBQ3JCUCxVQUFVUyxLQUFLRjs7O1lBSWpCLFNBQVNILGFBQWE7Z0JBQ2xCLE9BQU9wRCxPQUFPWSxNQUFNOEMsT0FBTyxVQUFVQyxHQUFHO29CQUNwQyxPQUFPQSxFQUFFQyxZQUFZRCxFQUFFQyxTQUFTaEU7OztZQUl4QyxTQUFTcUQsY0FBYzs7Z0JBRW5CLE9BQU9EOzs7Ozs7S0FaUjtBQ3RDTCxDQUFDLFlBQVk7SUFDVDtJQUFKckQsUUFBUUMsT0FBTyxlQUFlO0tBRXpCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFBSkQsUUFBUUMsT0FBTyxlQUNWUSxRQUFRLFVBQVV5RDs7SUFHdkIsU0FBU0EsY0FBY0MsTUFBTTtRQUV6QixJQUFJMUQsVUFBVTtZQUNWMkQsTUFBTUE7WUFDTkMsU0FBU0E7WUFDVEMsT0FBT0E7WUFDUGxDLEtBQUsrQjs7UUFHVCxPQUFPMUQ7UUFHUCxTQUFTMkQsS0FBS0csU0FBU0MsTUFBTTtZQUN6QkwsS0FBS0MsS0FBSyxXQUFXRyxTQUFTQzs7UUFHbEMsU0FBU0gsUUFBUUUsU0FBU0MsTUFBTTtZQUM1QkwsS0FBS0MsS0FBSyxjQUFjRyxTQUFTQzs7UUFHckMsU0FBU0YsTUFBTUMsU0FBU0MsTUFBTTtZQUMxQkwsS0FBS0csTUFBTSxZQUFZQyxTQUFTQzs7OztLQUpuQztBQ3RCTCxDQUFDLFlBQVk7SUFDVDtJQURKeEUsUUFBUUMsT0FBTyxjQUFjLENBQUMsY0FDN0J3QixJQUFJZ0Q7O0lBR0wsU0FBU0EsT0FBT0MsZ0JBQWdCO1FBRTVCQSxlQUFlbkIsU0FBU29COzs7SUFJNUIsU0FBU0EsWUFBWTtRQUNqQixPQUFPLENBQ0g7Z0JBQ0lwQyxNQUFNO2dCQUNOcUMsS0FBSztnQkFDTEMsWUFBWTtnQkFDWkMsY0FBYztnQkFDZEMsYUFBYTtnQkFDYmQsVUFBVTtvQkFDTmhFLFFBQVE7b0JBQ1IrRSxPQUFPOzs7O0tBQWxCO0FDcEJMLENBQUMsWUFBWTtJQUNUO0lBREpoRixRQUFRQyxPQUFPLGNBQ2Q0RSxXQUFXLG9CQUFvQkk7SUFFaEMsU0FBU0EsaUJBQWlCM0UsWUFBVztRQUVwQyxJQUFJNEUsS0FBSztRQUVUQSxHQUFHQyxTQUFTO1FBQ1pELEdBQUdFLFdBQVc7UUFDZEYsR0FBR0csUUFBUTtRQUVYSCxHQUFHSSxTQUFTLFVBQVNDLE9BQU07WUFDMUJMLEdBQUdFLFdBQVdHO1lBRWRqRixXQUFXVyxJQUFJLGFBQWFzRSxNQUFNQyxNQUFNLFVBQ3ZDdEUsS0FBSyxVQUFTOEMsR0FBRTtnQkFDaEJrQixHQUFHRyxRQUFRckIsRUFBRVE7OztRQUlmaUI7UUFHQSxTQUFTQSxPQUFNO1lBQ2RuRixXQUFXVyxJQUFJLFdBQ2RDLEtBQUssVUFBUzhDLEdBQUU7Z0JBQ2hCa0IsR0FBR0MsU0FBU25CLEVBQUVROzs7OztLQUxaO0FDckJMLENBQUMsWUFBWTtJQUNUO0lBREp4RSxRQUFRQyxPQUFPLGNBQWM7UUFBQztRQUFnQjs7S0FNekM7QUNOTCxDQUFDLFlBQVk7SUFDVDtJQURKRCxRQUFRQyxPQUFPLGNBQ1Z3QixJQUFJZ0Q7O0lBR1QsU0FBU0EsT0FBT0MsZ0JBQWdCO1FBRTVCQSxlQUFlbkIsU0FBUzs7O0tBQ3ZCO0FDUEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESnZELFFBQVFDLE9BQU8saUJBQWlCLENBQUMsaUJBQzVCd0IsSUFBSWdEOzs7Ozs7Ozs7Ozs7Ozs7SUFtQlQsU0FBU0EsT0FBT0MsZ0JBQWdCO1FBRTVCQSxlQUFlbkIsU0FBU29COzs7SUFJNUIsU0FBU0EsWUFBWTtRQUNqQixPQUFPLENBQ0g7Z0JBQ0lwQyxNQUFNO2dCQUNOcUMsS0FBSztnQkFDTEMsWUFBWTtnQkFDWkMsY0FBYztnQkFDZEMsYUFBYTtnQkFDYmQsVUFBVTtvQkFDTmhFLFFBQVE7b0JBQ1IrRSxPQUFPOzs7O0tBSGxCO0FDakNMLENBQUMsWUFBWTtJQUNUO0lBQUpoRixRQUFRQyxPQUFPLGlCQUNWNEUsV0FBVyx1QkFBdUJhOztJQUd2QyxTQUFTQSxzQkFBc0I7UUFDM0IsS0FBS25CLFVBQVU7O0tBQ2Q7QUNQTCxDQUFDLFlBQVk7SUFDVDtJQURKdkUsUUFBUUMsT0FBTyxjQUNWNEUsV0FBVyxtQkFBbUJjOztJQUduQyxTQUFTQSxnQkFBZ0JqQixnQkFBZ0I7UUFFckMsSUFBSVEsS0FBSztRQUNUQSxHQUFHeEIsV0FBV2dCLGVBQWVqQjs7O0tBQzVCO0FDUkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESnpELFFBQVFDLE9BQU8sY0FDVjRDLE9BQU8rQzs7SUFHWixTQUFTQSxpQkFBaUJqRCxnQkFBZ0I7UUFDdENBLGVBQ0tpQixNQUFNLFFBQVE7WUFDWGdCLEtBQUs7WUFDTGlCLFVBQVU7V0FFYmpDLE1BQU0sU0FBUztZQUNaZ0IsS0FBSztZQUNMQyxZQUFZO1lBQ1pFLGFBQWE7V0FFaEJuQixNQUFNLFlBQVk7WUFDZmdCLEtBQUs7WUFDTEMsWUFBWTtZQUNaRSxhQUFhO1lBQ2JsQixTQUFTOzs7O0tBQWhCO0FDbkJMLENBQUMsWUFBWTtJQUNUO0lBREo3RCxRQUFRQyxPQUFPLFdBQ1g7UUFDSTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7SUFHUkQsUUFBUUMsT0FBTyxXQUNkNEMsT0FBT0E7O0lBR1IsU0FBU0EsT0FBT2lELG9CQUFtQjtRQUNsQ0EsbUJBQW1CQyxVQUFVOzs7S0FBekIiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN1cml0eScsIFtdKVxyXG4gICAgLmZhY3RvcnkoJ3NlY3VyaXR5U2VydmljZScsIHNlY3VyaXR5U2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdXJpdHlTZXJ2aWNlKHN0b3JhZ2VTZXJ2aWNlLCAkc3RhdGUsIGh0dHBDbGllbnQsICRxKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50VXNlciA9IG51bGw7XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgcmVxdWVzdEN1cnJlbnRVc2VyOiBfcmVxdWVzdEN1cnJlbnRVc2VyLFxyXG5cclxuICAgICAgICBsb2dpbjogX2xvZ2luLFxyXG4gICAgICAgIGxvZ291dDogX2xvZ291dFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gX3JlcXVlc3RDdXJyZW50VXNlcigpIHtcclxuXHJcbiAgICAgICAgaWYgKF9jdXJyZW50VXNlcilcclxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oX2N1cnJlbnRVc2VyKTtcclxuXHJcblxyXG5cclxuICAgICAgICByZXR1cm4gaHR0cENsaWVudC5nZXQoJy90b2tlbnMvY3VycmVudCcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQsIHBlcnNpc3QpIHtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9nb3V0KCkge1xyXG4gICAgICAgIHN0b3JhZ2VTZXJ2aWNlLnJlbW92ZSgndG9rZW4nKTtcclxuICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICB9XHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycsIFsndWkucm91dGVyJ10pO1xyXG5cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKS5ydW4oZGVidWdSb3V0ZXMpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGRlYnVnUm91dGVzKCRyb290U2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICAvLyBDcmVkaXRzOiBBZGFtJ3MgYW5zd2VyIGluIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIwNzg2MjYyLzY5MzYyXHJcbiAgICAvLyBQYXN0ZSB0aGlzIGluIGJyb3dzZXIncyBjb25zb2xlXHJcblxyXG4gICAgLy92YXIgJHJvb3RTY29wZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW3VpLXZpZXddXCIpWzBdKS5pbmplY3RvcigpLmdldCgnJHJvb3RTY29wZScpO1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG4gICAgJHJvb3RTY29wZS4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN0YXJ0IHRvICcgKyB0b1N0YXRlLnRvICsgJy0gZmlyZWQgd2hlbiB0aGUgdHJhbnNpdGlvbiBiZWdpbnMuIHRvU3RhdGUsdG9QYXJhbXMgOiBcXG4nLCB0b1N0YXRlLCB0b1BhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3VjY2VzcyB0byAnICsgdG9TdGF0ZS5uYW1lICsgJy0gZmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZS4nKTtcclxuICAgIH0pO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHZpZXdDb250ZW50TG9hZGVkIC0gZmlyZWQgYWZ0ZXIgZG9tIHJlbmRlcmVkJywgZXZlbnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVOb3RGb3VuZCAnICsgdW5mb3VuZFN0YXRlLnRvICsgJyAgLSBmaXJlZCB3aGVuIGEgc3RhdGUgY2Fubm90IGJlIGZvdW5kIGJ5IGl0cyBuYW1lLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcclxuICAgIH0pO1xyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKVxyXG5cdC5wcm92aWRlcignc2VjdGlvbk1hbmFnZXInLCBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG5cclxuXHR2YXIgY29uZmlnID0ge1xyXG5cdFx0cmVzb2x2ZUFsd2F5czoge31cclxuXHR9O1xyXG5cclxuXHR0aGlzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcblx0XHRhbmd1bGFyLmV4dGVuZChjb25maWcsIG9wdHMpO1xyXG5cdH07XHJcblxyXG5cdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcclxuXHJcblxyXG5cdHRoaXMuJGdldCA9IFNlY3Rpb25NYW5hZ2VyU2VydmljZTtcclxuXHJcblx0Ly8gQG5nSW5qZWN0XHJcblx0ZnVuY3Rpb24gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlKCRyb290U2NvcGUsICRzdGF0ZSkge1xyXG5cclxuXHQgICAgdmFyIF9zZWN0aW9ucyA9IFtdO1xyXG5cclxuXHRcdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0XHRnZXRTZWN0aW9uczogZ2V0U2VjdGlvbnMsXHJcblx0XHRcdHJlZ2lzdGVyOiByZWdpc3RlclNlY3Rpb25zLFxyXG4gICAgICAgICAgICBnZXRNb2R1bGVzOiBnZXRNb2R1bGVzXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbnMoc2VjdGlvbnMpIHtcclxuXHRcdFx0c2VjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcclxuXHRcdFx0XHRzdGF0ZS5yZXNvbHZlID1cclxuXHRcdFx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHN0YXRlLnJlc29sdmUgfHwge30sIGNvbmZpZy5yZXNvbHZlQWx3YXlzKTtcclxuXHRcdFx0XHQkc3RhdGVQcm92aWRlci5zdGF0ZShzdGF0ZSk7XHJcblx0XHRcdFx0X3NlY3Rpb25zLnB1c2goc3RhdGUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRNb2R1bGVzKCkge1xyXG5cdFx0ICAgIHJldHVybiAkc3RhdGUuZ2V0KCkuZmlsdGVyKGZ1bmN0aW9uICh4KSB7XHJcblx0XHQgICAgICAgIHJldHVybiB4LnNldHRpbmdzICYmIHguc2V0dGluZ3MubW9kdWxlO1xyXG5cdFx0ICAgIH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNlY3Rpb25zKCkge1xyXG5cdFx0ICAgIC8vcmV0dXJuICRzdGF0ZS5nZXQoKTtcclxuXHRcdCAgICByZXR1cm4gX3NlY3Rpb25zO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycsIFtdKTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJylcclxuICAgIC5zZXJ2aWNlKCdsb2dnZXInLCBsb2dnZXJTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBsb2dnZXJTZXJ2aWNlKCRsb2cpIHtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBpbmZvOiBpbmZvLFxyXG4gICAgICAgIHdhcm5pbmc6IHdhcm5pbmcsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgIGxvZzogJGxvZ1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gaW5mbyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdJbmZvOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2FybmluZyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdXQVJOSU5HOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuZXJyb3IoJ0VSUk9SOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycsIFsndWkucm91dGVyJ10pXHJcbi5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICBzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRTdGF0ZXMoKSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTdGF0ZXMoKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ3N0b3JlcycsXHJcbiAgICAgICAgICAgIHVybDogJy9zdG9yZXMnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU3RvcmVzQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvc3RvcmVzL3N0b3Jlcy5odG1sJyxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiAyXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnKVxyXG4uY29udHJvbGxlcignU3RvcmVzQ29udHJvbGxlcicsIFN0b3Jlc0NvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gU3RvcmVzQ29udHJvbGxlcihodHRwQ2xpZW50KXtcclxuXHRcclxuXHR2YXIgdm0gPSB0aGlzO1xyXG5cclxuXHR2bS5zdG9yZXMgPSBbXTtcclxuXHR2bS5zZWxlY3RlZCA9IG51bGw7XHJcblx0dm0udGFza3MgPSBbXTtcclxuXHJcblx0dm0uc2VsZWN0ID0gZnVuY3Rpb24oc3RvcmUpe1xyXG5cdFx0dm0uc2VsZWN0ZWQgPSBzdG9yZTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuX2lkICsgJy90YXNrcycpXHJcblx0XHQudGhlbihmdW5jdGlvbih4KXtcclxuXHRcdFx0dm0udGFza3MgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cclxuXHRmdW5jdGlvbiBpbml0KCl7XHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3JlcycpXHJcblx0XHQudGhlbihmdW5jdGlvbih4KXtcclxuXHRcdFx0dm0uc3RvcmVzID0geC5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnLCBbJ3VpLmJvb3RzdHJhcCcsICd1aS5yb3V0ZXInXSk7ICIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICBzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihbXHJcblxyXG4gICAgXSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXNoYm9hcmQnLCBbJ2FwcC5zZWN0aW9ucyddKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG4vLy5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG4vLyAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuLy8gICAgICAgIHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PidcclxuLy8gICAgfSk7XHJcblxyXG4vLyAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGFzaGJvYXJkJywge1xyXG4vLyAgICAgICAgdXJsOiAnJyxcclxuLy8gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxyXG4vLyAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4vLyAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4vLyAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5odG1sJ1xyXG4vLyAgICB9KTtcclxuXHJcbi8vfSk7XHJcblxyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICBzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRTdGF0ZXMoKSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTdGF0ZXMoKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ2Rhc2hib2FyZCcsXHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXNoYm9hcmQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0Rhc2hib2FyZENvbnRyb2xsZXInLCBEYXNoYm9hcmRDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBEYXNoYm9hcmRDb250cm9sbGVyKCkge1xyXG4gICAgdGhpcy5tZXNzYWdlID0gXCJIZWxsbyBXb3JsZFwiO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ1NoZWxsQ29udHJvbGxlcicsIFNoZWxsQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU2hlbGxDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgdmFyIHZtID0gdGhpcztcclxuICAgIHZtLnNlY3Rpb25zID0gc2VjdGlvbk1hbmFnZXIuZ2V0TW9kdWxlcygpO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5jb25maWcoaW5pdGlhbGl6ZVN0YXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVN0YXRlcygkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgICAuc3RhdGUoJ3Jvb3QnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkNvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9sb2dpbi9sb2dpbi5odG1sJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1NoZWxsQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2xheW91dC9zaGVsbC5odG1sJyxcclxuICAgICAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgICAgICAgLy91c2VyOiBmdW5jdGlvbigpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmxheW91dCcsXHJcbiAgICAgICAgJ2FwcC5sb2dnaW5nJyxcclxuICAgICAgICAnYXBwLnNlY3Rpb25zJyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscycsXHJcbiAgICAgICAgJ2FwcC5kYXNoYm9hcmQnLFxyXG4gICAgICAgICdhcHAuc3RvcmVzJyxcclxuICAgICAgICAnc3ltYmlvdGUuY29tbW9uJ1xyXG4gICAgXSk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcbi5jb25maWcoY29uZmlnKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWcoaHR0cENsaWVudFByb3ZpZGVyKXtcclxuXHRodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCI7XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=