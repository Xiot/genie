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
            var defer = $q.defer();
            httpClient.get('/tokens/current').then(function (response) {
                defer.resolve(response.data);
                return response.data;
            }).catch(function (res) {
                if (res.status === 401)
                    return defer.resolve(null);
                defer.reject(res);
            });
            return defer.promise;
        }
        function _login(username, password, persist) {
            var text = btoa(username + ':' + password);
            return httpClient.post('/tokens', null, { auth: { 'Basic': text } });
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
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
            console.log('$stateChangeError - fired when an error occurs during transition.');
            console.log(arguments);
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
            console.log(unfoundState, fromState, fromParams);
        });    // $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
               //     console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
               // });
               // $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
               //     console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
               // });
               // $rootScope.$on('$viewContentLoaded', function (event) {
               //     console.log('$viewContentLoaded - fired after dom rendered', event);
               // });
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
                    if (state.parent === undefined)
                        state.parent = 'app-root';
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
    angular.module('solomon', [
        'app.layout',
        'app.logging',
        'app.sections',
        'app.security',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'symbiote.common'
    ]);
    angular.module('solomon').config(config);
    /* @ngInject */
    function config(httpClientProvider, $httpProvider) {
        httpClientProvider.baseUri = 'http://localhost:3000';
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.cache = true;
    }
    config.$inject = ["httpClientProvider", "$httpProvider"];
}());
(function () {
    'use strict';
    angular.module('solomon').directive('uiState', uiState);
    /* @ngInject */
    function uiState($state) {
        return {
            restrict: 'A',
            link: link
        };
        function link(scope, element, attrs) {
            var name = scope.$eval(attrs.uiState);
            var params = scope.$eval(attrs.uiStateParams);
            var url = $state.href(name, params);
            if (url === '')
                url = '/';
            attrs.$set('href', url);
        }
    }
    uiState.$inject = ["$state"];
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
    angular.module('app.layout').controller('LoginController', LoginController);
    /* @ngInject */
    function LoginController(securityService, $state) {
        var vm = this;
        vm.login = {
            username: '',
            password: '',
            rememberMe: false
        };
        this.busy = false;
        this.message = '';
        this.login = function () {
            this.busy = true;
            this.message = '';
            securityService.login(vm.login.username, vm.login.password, vm.login.rememberMe).then(function (ret) {
                $state.go('dashboard');
            }).catch(function (ex) {
                vm.message = ex.data && ex.data.message || 'Unable to log in';
            }).finally(function () {
                vm.busy = false;
            });
        };
    }
    LoginController.$inject = ["securityService", "$state"];
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
                url: '/',
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
    function initializeStates($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.state('root', {
            url: '/',
            //abstract: true,
            template: '<div ui-view></div>',
            resolve: {
                // @ngInject
                user: ["securityService", function (securityService) {
                    return securityService.requestCurrentUser();
                }]
            },
            onEnter: /* @ngInject */
            ["$state", "user", function ($state, user) {
                if (user)
                    return $state.go('dashboard');
                $state.go('login');
            }]
        }).state('login', {
            // url: '',
            controller: 'LoginController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/login/login.html'
        }).state('app-root', {
            //url: '',
            //parent: 'root',
            abstract: true,
            controller: 'ShellController',
            templateUrl: 'app/layout/shell.html',
            resolve: {},
            onEnter: function () {
                console.log('ShellController.onEnter');
            }
        });
    }
    initializeStates.$inject = ["$stateProvider", "$urlRouterProvider"];
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJhcmVhcy9zdG9yZXMvc3RvcmVzLm1vZHVsZS5qcyIsImFyZWFzL3N0b3Jlcy9TdG9yZXNDb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5jb250cm9sbGVyLmpzIiwiYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5Iiwic2VjdXJpdHlTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJzZXJ2aWNlIiwicmVxdWVzdEN1cnJlbnRVc2VyIiwiX3JlcXVlc3RDdXJyZW50VXNlciIsImxvZ2luIiwiX2xvZ2luIiwibG9nb3V0IiwiX2xvZ291dCIsIndoZW4iLCJkZWZlciIsImdldCIsInRoZW4iLCJyZXNwb25zZSIsInJlc29sdmUiLCJkYXRhIiwiY2F0Y2giLCJyZXMiLCJzdGF0dXMiLCJyZWplY3QiLCJwcm9taXNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInBlcnNpc3QiLCJ0ZXh0IiwiYnRvYSIsInBvc3QiLCJhdXRoIiwicmVtb3ZlIiwiZ28iLCJydW4iLCJkZWJ1Z1JvdXRlcyIsIiRyb290U2NvcGUiLCIkc3RhdGVQYXJhbXMiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwiYXJndW1lbnRzIiwidW5mb3VuZFN0YXRlIiwidG8iLCJwcm92aWRlciIsInNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIiLCIkc3RhdGVQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiY29uZmlnIiwicmVzb2x2ZUFsd2F5cyIsImNvbmZpZ3VyZSIsIm9wdHMiLCJleHRlbmQiLCJodG1sNU1vZGUiLCIkZ2V0IiwiU2VjdGlvbk1hbmFnZXJTZXJ2aWNlIiwiX3NlY3Rpb25zIiwiZ2V0U2VjdGlvbnMiLCJyZWdpc3RlciIsInJlZ2lzdGVyU2VjdGlvbnMiLCJnZXRNb2R1bGVzIiwic2VjdGlvbnMiLCJmb3JFYWNoIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJwdXNoIiwiZmlsdGVyIiwieCIsInNldHRpbmdzIiwibG9nZ2VyU2VydmljZSIsIiRsb2ciLCJpbmZvIiwid2FybmluZyIsImVycm9yIiwibWVzc2FnZSIsImh0dHBDbGllbnRQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCJiYXNlVXJpIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwid2l0aENyZWRlbnRpYWxzIiwiY2FjaGUiLCJkaXJlY3RpdmUiLCJ1aVN0YXRlIiwicmVzdHJpY3QiLCJsaW5rIiwic2NvcGUiLCJlbGVtZW50IiwiYXR0cnMiLCJuYW1lIiwiJGV2YWwiLCJwYXJhbXMiLCJ1aVN0YXRlUGFyYW1zIiwidXJsIiwiaHJlZiIsIiRzZXQiLCJhcHBSdW4iLCJzZWN0aW9uTWFuYWdlciIsImdldFN0YXRlcyIsImNvbnRyb2xsZXIiLCJjb250cm9sbGVyQXMiLCJ0ZW1wbGF0ZVVybCIsIm9yZGVyIiwiU3RvcmVzQ29udHJvbGxlciIsInZtIiwic3RvcmVzIiwic2VsZWN0ZWQiLCJ0YXNrcyIsInNlbGVjdCIsInN0b3JlIiwiX2lkIiwiaW5pdCIsIkxvZ2luQ29udHJvbGxlciIsInJlbWVtYmVyTWUiLCJidXN5IiwicmV0IiwiZXgiLCJmaW5hbGx5IiwiRGFzaGJvYXJkQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsImluaXRpYWxpemVTdGF0ZXMiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJ0ZW1wbGF0ZSIsInVzZXIiLCJvbkVudGVyIiwiYWJzdHJhY3QiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBREpBLFFBQVFDLE9BQU8sZ0JBQWdCLElBQzFCQyxRQUFRLG1CQUFtQkM7O0lBR2hDLFNBQVNBLGdCQUFnQkMsZ0JBQWdCQyxRQUFRQyxZQUFZQyxJQUFJO1FBRTdELElBQUlDLGVBQWU7UUFFbkIsSUFBSUMsVUFBVTtZQUNWQyxvQkFBb0JDO1lBRXBCQyxPQUFPQztZQUNQQyxRQUFRQzs7UUFHWixPQUFPTjtRQUdQLFNBQVNFLHNCQUFzQjtZQUUzQixJQUFJSDtnQkFDQSxPQUFPRCxHQUFHUyxLQUFLUjtZQUVuQixJQUFJUyxRQUFRVixHQUFHVTtZQUVmWCxXQUFXWSxJQUFJLG1CQUNWQyxLQUFLLFVBQVNDLFVBQVU7Z0JBQ3JCSCxNQUFNSSxRQUFRRCxTQUFTRTtnQkFDdkIsT0FBT0YsU0FBU0U7ZUFDakJDLE1BQU0sVUFBU0MsS0FBSztnQkFDbkIsSUFBSUEsSUFBSUMsV0FBVztvQkFDZixPQUFPUixNQUFNSSxRQUFRO2dCQUN6QkosTUFBTVMsT0FBT0Y7O1lBR3JCLE9BQU9QLE1BQU1VOztRQUdqQixTQUFTZCxPQUFPZSxVQUFVQyxVQUFVQyxTQUFTO1lBRXpDLElBQUlDLE9BQU9DLEtBQUtKLFdBQVcsTUFBTUM7WUFDakMsT0FBT3ZCLFdBQVcyQixLQUFLLFdBQVUsTUFBTSxFQUFDQyxNQUFNLEVBQUMsU0FBVUg7O1FBSzdELFNBQVNoQixVQUFVO1lBQ2ZYLGVBQWUrQixPQUFPO1lBQ3RCOUIsT0FBTytCLEdBQUc7Ozs7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QkFDZEMsYUFBYTtnQkFDYmpDLFVBQVU7b0JBQ041RSxRQUFRO29CQUNSOEcsT0FBTzs7OztLQUhsQjtBQ2pDTCxDQUFDLFlBQVk7SUFDVDtJQUFKL0csUUFBUUMsT0FBTyxpQkFDVjJHLFdBQVcsdUJBQXVCbUI7O0lBR3ZDLFNBQVNBLHNCQUFzQjtRQUMzQixLQUFLNUMsVUFBVTs7S0FDZDtBQ1BMLENBQUMsWUFBWTtJQUNUO0lBREpuRixRQUFRQyxPQUFPLGNBQ1YyRyxXQUFXLG1CQUFtQm9COztJQUduQyxTQUFTQSxnQkFBZ0J0QixnQkFBZ0I7UUFFckMsSUFBSU8sS0FBSztRQUNUQSxHQUFHNUMsV0FBV3FDLGVBQWV0Qzs7O0tBQzVCO0FDUkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESnBFLFFBQVFDLE9BQU8sY0FDVnVELE9BQU95RTs7SUFHWixTQUFTQSxpQkFBaUIzRSxnQkFBZ0I0RSxvQkFBb0I7UUFFMURBLG1CQUFtQkMsVUFBVTtRQUc3QjdFLGVBQ0tpQixNQUFNLFFBQVE7WUFDWCtCLEtBQUs7O1lBRUw4QixVQUFVO1lBQ1YvRyxTQUFTOztnQkFFTGdILDBCQUFNLFVBQVNsSSxpQkFBZ0I7b0JBQzNCLE9BQU9BLGdCQUFnQk87OztZQUcvQjRIOytCQUF3QixVQUFTakksUUFBUWdJLE1BQUs7Z0JBQzFDLElBQUdBO29CQUNDLE9BQU9oSSxPQUFPK0IsR0FBRztnQkFFckIvQixPQUFPK0IsR0FBRzs7V0FHakJtQyxNQUFNLFNBQVM7O1lBRVpxQyxZQUFZO1lBQ1pDLGNBQWM7WUFDZEMsYUFBYTtXQUVoQnZDLE1BQU0sWUFBWTs7O1lBR2ZnRSxVQUFVO1lBQ1YzQixZQUFZO1lBQ1pFLGFBQWE7WUFDYnpGLFNBQVM7WUFHVGlILFNBQVMsWUFBVTtnQkFDZnZGLFFBQVFDLElBQUk7Ozs7O0tBSnZCIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdXJpdHknLCBbXSlcclxuICAgIC5mYWN0b3J5KCdzZWN1cml0eVNlcnZpY2UnLCBzZWN1cml0eVNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3VyaXR5U2VydmljZShzdG9yYWdlU2VydmljZSwgJHN0YXRlLCBodHRwQ2xpZW50LCAkcSkge1xyXG5cclxuICAgIHZhciBfY3VycmVudFVzZXIgPSBudWxsO1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIHJlcXVlc3RDdXJyZW50VXNlcjogX3JlcXVlc3RDdXJyZW50VXNlcixcclxuXHJcbiAgICAgICAgbG9naW46IF9sb2dpbixcclxuICAgICAgICBsb2dvdXQ6IF9sb2dvdXRcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0Q3VycmVudFVzZXIoKSB7XHJcblxyXG4gICAgICAgIGlmIChfY3VycmVudFVzZXIpXHJcbiAgICAgICAgICAgIHJldHVybiAkcS53aGVuKF9jdXJyZW50VXNlcik7XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgICAgIGh0dHBDbGllbnQuZ2V0KCcvdG9rZW5zL2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QocmVzKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQsIHBlcnNpc3QpIHtcclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSBidG9hKHVzZXJuYW1lICsgXCI6XCIgKyBwYXNzd29yZCk7XHJcbiAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQucG9zdCgnL3Rva2VucycsbnVsbCwge2F1dGg6IHsnQmFzaWMnIDogdGV4dH19KVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ291dCgpIHtcclxuICAgICAgICBzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3Rva2VuJyk7XHJcbiAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpLnJ1bihkZWJ1Z1JvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZGVidWdSb3V0ZXMoJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgIC8vIENyZWRpdHM6IEFkYW0ncyBhbnN3ZXIgaW4gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3ODYyNjIvNjkzNjJcclxuICAgIC8vIFBhc3RlIHRoaXMgaW4gYnJvd3NlcidzIGNvbnNvbGVcclxuXHJcbiAgICAvL3ZhciAkcm9vdFNjb3BlID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdWktdmlld11cIilbMF0pLmluamVjdG9yKCkuZ2V0KCckcm9vdFNjb3BlJyk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlTm90Rm91bmQgJyArIHVuZm91bmRTdGF0ZS50byArICcgIC0gZmlyZWQgd2hlbiBhIHN0YXRlIGNhbm5vdCBiZSBmb3VuZCBieSBpdHMgbmFtZS4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3RhcnQgdG8gJyArIHRvU3RhdGUudG8gKyAnLSBmaXJlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGJlZ2lucy4gdG9TdGF0ZSx0b1BhcmFtcyA6IFxcbicsIHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MgdG8gJyArIHRvU3RhdGUubmFtZSArICctIGZpcmVkIG9uY2UgdGhlIHN0YXRlIHRyYW5zaXRpb24gaXMgY29tcGxldGUuJyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyR2aWV3Q29udGVudExvYWRlZCAtIGZpcmVkIGFmdGVyIGRvbSByZW5kZXJlZCcsIGV2ZW50KTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH07XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRpZihzdGF0ZS5wYXJlbnQgPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdHN0YXRlLnBhcmVudCA9ICdhcHAtcm9vdCc7XHJcblxyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmxheW91dCcsXHJcbiAgICAgICAgJ2FwcC5sb2dnaW5nJyxcclxuICAgICAgICAnYXBwLnNlY3Rpb25zJyxcclxuICAgICAgICAnYXBwLnNlY3VyaXR5JyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscycsXHJcbiAgICAgICAgJ2FwcC5kYXNoYm9hcmQnLFxyXG4gICAgICAgICdhcHAuc3RvcmVzJyxcclxuICAgICAgICAnc3ltYmlvdGUuY29tbW9uJ1xyXG4gICAgXSk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcbi5jb25maWcoY29uZmlnKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWcoaHR0cENsaWVudFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKXtcclxuXHRodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCI7XHJcblxyXG4gICAgICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLndpdGhDcmVkZW50aWFscyA9IHRydWU7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmNhY2hlID0gdHJ1ZTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJylcclxuXHQuZGlyZWN0aXZlKCd1aVN0YXRlJywgdWlTdGF0ZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gdWlTdGF0ZSgkc3RhdGUpIHtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnQScsXHJcblx0XHRsaW5rOiBsaW5rLFxyXG5cclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuXHJcblx0XHR2YXIgbmFtZSA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGUpO1xyXG5cdFx0dmFyIHBhcmFtcyA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGVQYXJhbXMpO1xyXG5cclxuXHRcdHZhciB1cmwgPSAkc3RhdGUuaHJlZihuYW1lLCBwYXJhbXMpO1xyXG5cclxuXHRcdGlmKHVybCA9PT0gXCJcIilcclxuXHRcdFx0dXJsID0gXCIvXCI7XHJcblxyXG5cdFx0YXR0cnMuJHNldCgnaHJlZicsIHVybCk7XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJywgWyd1aS5yb3V0ZXInXSlcclxuLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnc3RvcmVzJyxcclxuICAgICAgICAgICAgdXJsOiAnL3N0b3JlcycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdG9yZXNDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9zdG9yZXMvc3RvcmVzLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycpXHJcbi5jb250cm9sbGVyKCdTdG9yZXNDb250cm9sbGVyJywgU3RvcmVzQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBTdG9yZXNDb250cm9sbGVyKGh0dHBDbGllbnQpe1xyXG5cdFxyXG5cdHZhciB2bSA9IHRoaXM7XHJcblxyXG5cdHZtLnN0b3JlcyA9IFtdO1xyXG5cdHZtLnNlbGVjdGVkID0gbnVsbDtcclxuXHR2bS50YXNrcyA9IFtdO1xyXG5cclxuXHR2bS5zZWxlY3QgPSBmdW5jdGlvbihzdG9yZSl7XHJcblx0XHR2bS5zZWxlY3RlZCA9IHN0b3JlO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5faWQgKyAnL3Rhc2tzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS50YXNrcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS5zdG9yZXMgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcsIFsndWkuYm9vdHN0cmFwJywgJ3VpLnJvdXRlciddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKFtcclxuXHJcbiAgICBdKTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbi5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBMb2dpbkNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvZ2luQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsICRzdGF0ZSl7XHJcblx0XHJcblx0dmFyIHZtID10aGlzO1xyXG5cdHZtLmxvZ2luID0ge1xyXG5cdFx0dXNlcm5hbWU6IFwiXCIsXHJcblx0XHRwYXNzd29yZDogXCJcIixcclxuXHRcdHJlbWVtYmVyTWU6IGZhbHNlXHJcblx0fTtcclxuXHJcblx0dGhpcy5idXN5ID0gZmFsc2U7XHJcblx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmJ1c3kgPSB0cnVlO1xyXG5cdFx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UubG9naW4odm0ubG9naW4udXNlcm5hbWUsIHZtLmxvZ2luLnBhc3N3b3JkLCB2bS5sb2dpbi5yZW1lbWJlck1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXQpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdFx0dm0ubWVzc2FnZSA9IChleC5kYXRhICYmIGV4LmRhdGEubWVzc2FnZSkgfHwgXCJVbmFibGUgdG8gbG9nIGluXCI7XHJcblxyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dm0uYnVzeSA9IGZhbHNlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAuY29udHJvbGxlcignU2hlbGxDb250cm9sbGVyJywgU2hlbGxDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTaGVsbENvbnRyb2xsZXIoc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICB2YXIgdm0gPSB0aGlzO1xyXG4gICAgdm0uc2VjdGlvbnMgPSBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKCk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLmNvbmZpZyhpbml0aWFsaXplU3RhdGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgLy9hYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+JyxcclxuICAgICAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgICAgICAgLy8gQG5nSW5qZWN0XHJcbiAgICAgICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihzZWN1cml0eVNlcnZpY2Upe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICBvbkVudGVyOi8qIEBuZ0luamVjdCAqLyBmdW5jdGlvbigkc3RhdGUsIHVzZXIpe1xyXG4gICAgICAgICAgICAgICAgaWYodXNlcilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XHJcbiAgICAgICAgICAgIC8vIHVybDogJycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkNvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6IFwidm1cIixcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbG9naW4vbG9naW4uaHRtbCdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnYXBwLXJvb3QnLCB7XHJcbiAgICAgICAgICAgIC8vdXJsOiAnJyxcclxuICAgICAgICAgICAgLy9wYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIC8vdXNlcjogZnVuY3Rpb24oKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkVudGVyOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==