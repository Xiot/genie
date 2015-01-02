(function () {
    'use strict';
    angular.module('app.security', []).factory('securityService', securityService);
    /* @ngInject */
    function securityService(storageService, $state, httpClient, $q) {
        var _currentUser = null;
        var service = {
            currentUser: function () {
                return _currentUser;
            },
            requestCurrentUser: _requestCurrentUser,
            login: _login,
            logout: _logout
        };
        return service;
        function _requestCurrentUser(token) {
            if (_currentUser)
                return $q.when(_currentUser);
            var options = { cache: false };
            if (token)
                options.auth = { 'Bearer': token };
            var defer = $q.defer();
            httpClient.get('/tokens/current', options).then(function (response) {
                _currentUser = response.data;
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
            var token = null;
            return httpClient.post('/tokens', null, { auth: { 'Basic': text } }).then(function (res) {
                token = res.data.auth_token;
                return _requestCurrentUser(token);
            }).then(function (user) {
                storageService.set('auth-token', token, true);
                return user;
            });
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
        'symbiote.common',
        'ngAnimate'
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
    angular.module('app.layout').config(initializeStates).run(ensureAuthenticated);
    /* @ngInject */
    function ensureAuthenticated($rootScope, $state, securityService, $timeout) {
        $rootScope.showSplash = true;
        $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
            if (toState.name === 'login') {
                //$rootScope.showSplash = false;
                return;
            }
            var user = securityService.currentUser();
            if (user) {
                //$rootScope.showSplash = false;
                return;
            }
            e.preventDefault();
            securityService.requestCurrentUser().then(function (u) {
                var targetState = u ? toState : 'login';
                $state.go(targetState);
            }).catch(function (ex) {
                $state.go('login');
            })    //console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
;
        });
        var waitingForView = false;
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            //console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
            //console.log('state.success: ' + toState.name);
            waitingForView = true;
        });
        $rootScope.$on('$viewContentLoaded', function (e) {
            if (waitingForView) {
                waitingForView = false;
                console.log('give time to render');
                $timeout(function () {
                    console.log('showSplash = false');
                    $rootScope.showSplash = false;
                }, 1000);
            }
        });
    }
    ensureAuthenticated.$inject = ["$rootScope", "$state", "securityService", "$timeout"];
    /* @ngInject */
    function initializeStates($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.state('root', {
            url: '',
            abstract: true,
            template: '<div ui-view></div>',
            controller: ["$scope", "$rootScope", function ($scope, $rootScope) {
                if ($rootScope.showSplash === undefined)
                    $rootScope.showSplash = true;
            }],
            resolve: {
                // @ngInject
                user: ["securityService", function (securityService) {
                    return securityService.requestCurrentUser();
                }]
            },
            onEnter: /* @ngInject */
            ["$state", "user", function ($state, user) {
            }]
        }).state('login', {
            // url: '',
            controller: 'LoginController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/login/login.html'
        }).state('app-root', {
            //url: '',
            parent: 'root',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJhcmVhcy9zdG9yZXMvc3RvcmVzLm1vZHVsZS5qcyIsImFyZWFzL3N0b3Jlcy9TdG9yZXNDb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5jb250cm9sbGVyLmpzIiwiYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5Iiwic2VjdXJpdHlTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJzZXJ2aWNlIiwiY3VycmVudFVzZXIiLCJyZXF1ZXN0Q3VycmVudFVzZXIiLCJfcmVxdWVzdEN1cnJlbnRVc2VyIiwibG9naW4iLCJfbG9naW4iLCJsb2dvdXQiLCJfbG9nb3V0IiwidG9rZW4iLCJ3aGVuIiwib3B0aW9ucyIsImNhY2hlIiwiYXV0aCIsImRlZmVyIiwiZ2V0IiwidGhlbiIsInJlc3BvbnNlIiwiZGF0YSIsInJlc29sdmUiLCJjYXRjaCIsInJlcyIsInN0YXR1cyIsInJlamVjdCIsInByb21pc2UiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwicGVyc2lzdCIsInRleHQiLCJidG9hIiwicG9zdCIsImF1dGhfdG9rZW4iLCJ1c2VyIiwic2V0IiwicmVtb3ZlIiwiZ28iLCJydW4iLCJkZWJ1Z1JvdXRlcyIsIiRyb290U2NvcGUiLCIkc3RhdGVQYXJhbXMiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwiYXJndW1lbnRzIiwidW5mb3VuZFN0YXRlIiwidG8iLCJwcm92aWRlciIsInNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIiLCIkc3RhdGVQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiY29uZmlnIiwicmVzb2x2ZUFsd2F5cyIsImNvbmZpZ3VyZSIsIm9wdHMiLCJleHRlbmQiLCJodG1sNU1vZGUiLCIkZ2V0IiwiU2VjdGlvbk1hbmFnZXJTZXJ2aWNlIiwiX3NlY3Rpb25zIiwiZ2V0U2VjdGlvbnMiLCJyZWdpc3RlciIsInJlZ2lzdGVyU2VjdGlvbnMiLCJnZXRNb2R1bGVzIiwic2VjdGlvbnMiLCJmb3JFYWNoIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJwdXNoIiwiZmlsdGVyIiwieCIsInNldHRpbmdzIiwibG9nZ2VyU2VydmljZSIsIiRsb2ciLCJpbmZvIiwid2FybmluZyIsImVycm9yIiwibWVzc2FnZSIsImh0dHBDbGllbnRQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCJiYXNlVXJpIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwid2l0aENyZWRlbnRpYWxzIiwiZGlyZWN0aXZlIiwidWlTdGF0ZSIsInJlc3RyaWN0IiwibGluayIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwibmFtZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiYXBwUnVuIiwic2VjdGlvbk1hbmFnZXIiLCJnZXRTdGF0ZXMiLCJjb250cm9sbGVyIiwiY29udHJvbGxlckFzIiwidGVtcGxhdGVVcmwiLCJvcmRlciIsIlN0b3Jlc0NvbnRyb2xsZXIiLCJ2bSIsInN0b3JlcyIsInNlbGVjdGVkIiwidGFza3MiLCJzZWxlY3QiLCJzdG9yZSIsIl9pZCIsImluaXQiLCJMb2dpbkNvbnRyb2xsZXIiLCJyZW1lbWJlck1lIiwiYnVzeSIsInJldCIsImV4IiwiZmluYWxseSIsIkRhc2hib2FyZENvbnRyb2xsZXIiLCJTaGVsbENvbnRyb2xsZXIiLCJpbml0aWFsaXplU3RhdGVzIiwiZW5zdXJlQXV0aGVudGljYXRlZCIsIiR0aW1lb3V0Iiwic2hvd1NwbGFzaCIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInUiLCJ0YXJnZXRTdGF0ZSIsIndhaXRpbmdGb3JWaWV3IiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwiYWJzdHJhY3QiLCJ0ZW1wbGF0ZSIsIiRzY29wZSIsIm9uRW50ZXIiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBREpBLFFBQVFDLE9BQU8sZ0JBQWdCLElBQzFCQyxRQUFRLG1CQUFtQkM7O0lBR2hDLFNBQVNBLGdCQUFnQkMsZ0JBQWdCQyxRQUFRQyxZQUFZQyxJQUFJO1FBRTdELElBQUlDLGVBQWU7UUFFbkIsSUFBSUMsVUFBVTtZQUNWQyxhQUFhLFlBQVU7Z0JBQUMsT0FBT0Y7O1lBQy9CRyxvQkFBb0JDO1lBRXBCQyxPQUFPQztZQUNQQyxRQUFRQzs7UUFHWixPQUFPUDtRQUdQLFNBQVNHLG9CQUFvQkssT0FBTztZQUVoQyxJQUFJVDtnQkFDQSxPQUFPRCxHQUFHVyxLQUFLVjtZQUduQixJQUFJVyxVQUFVLEVBQ1ZDLE9BQU87WUFFWCxJQUFJSDtnQkFDQUUsUUFBUUUsT0FBTyxFQUNYLFVBQVVKO1lBR2xCLElBQUlLLFFBQVFmLEdBQUdlO1lBRWZoQixXQUFXaUIsSUFBSSxtQkFBbUJKLFNBQzdCSyxLQUFLLFVBQVNDLFVBQVU7Z0JBRXJCakIsZUFBZWlCLFNBQVNDO2dCQUV4QkosTUFBTUssUUFBUUYsU0FBU0M7Z0JBQ3ZCLE9BQU9ELFNBQVNDO2VBRWpCRSxNQUFNLFVBQVNDLEtBQUs7Z0JBQ25CLElBQUlBLElBQUlDLFdBQVc7b0JBQ2YsT0FBT1IsTUFBTUssUUFBUTtnQkFDekJMLE1BQU1TLE9BQU9GOztZQUdyQixPQUFPUCxNQUFNVTs7UUFHakIsU0FBU2xCLE9BQU9tQixVQUFVQyxVQUFVQyxTQUFTO1lBRXpDLElBQUlDLE9BQU9DLEtBQUtKLFdBQVcsTUFBTUM7WUFDakMsSUFBSWpCLFFBQVE7WUFFWixPQUFPWCxXQUFXZ0MsS0FBSyxXQUFXLE1BQU0sRUFDaENqQixNQUFNLEVBQ0YsU0FBU2UsVUFHaEJaLEtBQUssVUFBU0ssS0FBSztnQkFDaEJaLFFBQVFZLElBQUlILEtBQUthO2dCQUVqQixPQUFPM0Isb0JBQW9CSztlQUM1Qk8sS0FBSyxVQUFTZ0IsTUFBTTtnQkFDbkJwQyxlQUFlcUMsSUFBSSxjQUFjeEIsT0FBTztnQkFDeEMsT0FBT3VCOzs7UUFJbkIsU0FBU3hCLFVBQVU7WUFDZlosZUFBZXNDLE9BQU87WUFDdEJyQyxPQUFPc0MsR0FBRzs7OztLQXpCYjtBQ2pETCxDQUFDLFlBQVk7SUFDVDtJQUFKM0MsUUFBUUMsT0FBTyxnQkFBZ0IsQ0FBQztJQUdoQ0QsUUFBUUMsT0FBTyxnQkFBZ0IyQyxJQUFJQzs7SUFHbkMsU0FBU0EsWUFBWUMsWUFBWXpDLFFBQVEwQyxjQUFjOzs7O1FBTW5ERCxXQUFXekMsU0FBU0E7UUFDcEJ5QyxXQUFXQyxlQUFlQTtRQUUxQkQsV0FBV0UsSUFBSSxxQkFBcUIsVUFBVUMsT0FBT0MsU0FBU0MsVUFBVUMsV0FBV0MsWUFBWTtZQUMzRkMsUUFBUUMsSUFBSTtZQUNaRCxRQUFRQyxJQUFJQzs7UUFHaEJWLFdBQVdFLElBQUksa0JBQWtCLFVBQVVDLE9BQU9RLGNBQWNMLFdBQVdDLFlBQVk7WUFDbkZDLFFBQVFDLElBQUksb0JBQW9CRSxhQUFhQyxLQUFLO1lBQ2xESixRQUFRQyxJQUFJRSxjQUFjTCxXQUFXQzs7Ozs7Ozs7Ozs7O0tBS3hDO0FDNUJMLENBQUMsWUFBWTtJQUNUO0lBQUpyRCxRQUFRQyxPQUFPLGdCQUNiMEQsU0FBUyxrQkFBa0JDOztJQUc3QixTQUFTQSx1QkFBdUJDLGdCQUFnQkMsbUJBQW1CO1FBRWxFLElBQUlDLFNBQVMsRUFDWkMsZUFBZTtRQUdoQixLQUFLQyxZQUFZLFVBQVVDLE1BQU07WUFDaENsRSxRQUFRbUUsT0FBT0osUUFBUUc7O1FBR3hCSixrQkFBa0JNLFVBQVU7UUFHNUIsS0FBS0MsT0FBT0M7O1FBR1osU0FBU0Esc0JBQXNCeEIsWUFBWXpDLFFBQVE7WUFFL0MsSUFBSWtFLFlBQVk7WUFFbkIsSUFBSTlELFVBQVU7Z0JBQ2IrRCxhQUFhQTtnQkFDYkMsVUFBVUM7Z0JBQ0RDLFlBQVlBOztZQUd0QixPQUFPbEU7WUFFUCxTQUFTaUUsaUJBQWlCRSxVQUFVO2dCQUNuQ0EsU0FBU0MsUUFBUSxVQUFVQyxPQUFPO29CQUVqQyxJQUFHQSxNQUFNQyxXQUFXQzt3QkFDbkJGLE1BQU1DLFNBQVM7b0JBRWhCRCxNQUFNbkQsVUFDTDNCLFFBQVFtRSxPQUFPVyxNQUFNbkQsV0FBVyxJQUFJb0MsT0FBT0M7b0JBQzVDSCxlQUFlaUIsTUFBTUE7b0JBQ3JCUCxVQUFVVSxLQUFLSDs7O1lBSWpCLFNBQVNILGFBQWE7Z0JBQ2xCLE9BQU90RSxPQUFPa0IsTUFBTTJELE9BQU8sVUFBVUMsR0FBRztvQkFDcEMsT0FBT0EsRUFBRUMsWUFBWUQsRUFBRUMsU0FBU25GOzs7WUFJeEMsU0FBU3VFLGNBQWM7O2dCQUVuQixPQUFPRDs7Ozs7O0tBZFI7QUN4Q0wsQ0FBQyxZQUFZO0lBQ1Q7SUFBSnZFLFFBQVFDLE9BQU8sZUFBZTtLQUV6QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBQUpELFFBQVFDLE9BQU8sZUFDVlEsUUFBUSxVQUFVNEU7O0lBR3ZCLFNBQVNBLGNBQWNDLE1BQU07UUFFekIsSUFBSTdFLFVBQVU7WUFDVjhFLE1BQU1BO1lBQ05DLFNBQVNBO1lBQ1RDLE9BQU9BO1lBQ1BsQyxLQUFLK0I7O1FBR1QsT0FBTzdFO1FBR1AsU0FBUzhFLEtBQUtHLFNBQVNoRSxNQUFNO1lBQ3pCNEQsS0FBS0MsS0FBSyxXQUFXRyxTQUFTaEU7O1FBR2xDLFNBQVM4RCxRQUFRRSxTQUFTaEUsTUFBTTtZQUM1QjRELEtBQUtDLEtBQUssY0FBY0csU0FBU2hFOztRQUdyQyxTQUFTK0QsTUFBTUMsU0FBU2hFLE1BQU07WUFDMUI0RCxLQUFLRyxNQUFNLFlBQVlDLFNBQVNoRTs7OztLQUpuQztBQ3RCTCxDQUFDLFlBQVk7SUFDVDtJQURKMUIsUUFBUUMsT0FBTyxXQUNYO1FBQ0k7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztJQUdSRCxRQUFRQyxPQUFPLFdBQ2Q4RCxPQUFPQTs7SUFHUixTQUFTQSxPQUFPNEIsb0JBQW9CQyxlQUFjO1FBQ2pERCxtQkFBbUJFLFVBQVU7UUFFdEJELGNBQWNFLFNBQVNDLGFBQWE7UUFDeENILGNBQWNFLFNBQVNFLGtCQUFrQjtRQUN6Q0osY0FBY0UsU0FBUzFFLFFBQVE7OztLQUQ5QjtBQ3JCTCxDQUFDLFlBQVk7SUFDVDtJQURKcEIsUUFBUUMsT0FBTyxXQUNiZ0csVUFBVSxXQUFXQzs7SUFHdkIsU0FBU0EsUUFBUTdGLFFBQVE7UUFFeEIsT0FBTztZQUNOOEYsVUFBVTtZQUNWQyxNQUFNQTs7UUFJUCxTQUFTQSxLQUFLQyxPQUFPQyxTQUFTQyxPQUFPO1lBRXBDLElBQUlDLE9BQU9ILE1BQU1JLE1BQU1GLE1BQU1MO1lBQzdCLElBQUlRLFNBQVNMLE1BQU1JLE1BQU1GLE1BQU1JO1lBRS9CLElBQUlDLE1BQU12RyxPQUFPd0csS0FBS0wsTUFBTUU7WUFFNUIsSUFBR0UsUUFBUTtnQkFDVkEsTUFBTTtZQUVQTCxNQUFNTyxLQUFLLFFBQVFGOzs7O0tBSmhCO0FDbEJMLENBQUMsWUFBWTtJQUNUO0lBREo1RyxRQUFRQyxPQUFPLGNBQWMsQ0FBQyxjQUM3QjJDLElBQUltRTs7SUFHTCxTQUFTQSxPQUFPQyxnQkFBZ0I7UUFFNUJBLGVBQWV2QyxTQUFTd0M7OztJQUk1QixTQUFTQSxZQUFZO1FBQ2pCLE9BQU8sQ0FDSDtnQkFDSVQsTUFBTTtnQkFDTkksS0FBSztnQkFDTE0sWUFBWTtnQkFDWkMsY0FBYztnQkFDZEMsYUFBYTtnQkFDYmhDLFVBQVU7b0JBQ05uRixRQUFRO29CQUNSb0gsT0FBTzs7OztLQUFsQjtBQ3BCTCxDQUFDLFlBQVk7SUFDVDtJQURKckgsUUFBUUMsT0FBTyxjQUNkaUgsV0FBVyxvQkFBb0JJO0lBRWhDLFNBQVNBLGlCQUFpQmhILFlBQVc7UUFFcEMsSUFBSWlILEtBQUs7UUFFVEEsR0FBR0MsU0FBUztRQUNaRCxHQUFHRSxXQUFXO1FBQ2RGLEdBQUdHLFFBQVE7UUFFWEgsR0FBR0ksU0FBUyxVQUFTQyxPQUFNO1lBQzFCTCxHQUFHRSxXQUFXRztZQUVkdEgsV0FBV2lCLElBQUksYUFBYXFHLE1BQU1DLE1BQU0sVUFDdkNyRyxLQUFLLFVBQVMyRCxHQUFFO2dCQUNoQm9DLEdBQUdHLFFBQVF2QyxFQUFFekQ7OztRQUlmb0c7UUFHQSxTQUFTQSxPQUFNO1lBQ2R4SCxXQUFXaUIsSUFBSSxXQUNkQyxLQUFLLFVBQVMyRCxHQUFFO2dCQUNoQm9DLEdBQUdDLFNBQVNyQyxFQUFFekQ7Ozs7O0tBTFo7QUNyQkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESjFCLFFBQVFDLE9BQU8sY0FBYztRQUFDO1FBQWdCOztLQU16QztBQ05MLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDVjJDLElBQUltRTs7SUFHVCxTQUFTQSxPQUFPQyxnQkFBZ0I7UUFFNUJBLGVBQWV2QyxTQUFTOzs7S0FDdkI7QUNQTCxDQUFDLFlBQVk7SUFDVDtJQURKekUsUUFBUUMsT0FBTyxjQUNkaUgsV0FBVyxtQkFBbUJhOztJQUcvQixTQUFTQSxnQkFBZ0I1SCxpQkFBaUJFLFFBQU87UUFFaEQsSUFBSWtILEtBQUk7UUFDUkEsR0FBRzFHLFFBQVE7WUFDVm9CLFVBQVU7WUFDVkMsVUFBVTtZQUNWOEYsWUFBWTs7UUFHYixLQUFLQyxPQUFPO1FBQ1osS0FBS3ZDLFVBQVU7UUFFZixLQUFLN0UsUUFBUSxZQUFVO1lBQ3RCLEtBQUtvSCxPQUFPO1lBQ1osS0FBS3ZDLFVBQVU7WUFFZnZGLGdCQUFnQlUsTUFBTTBHLEdBQUcxRyxNQUFNb0IsVUFBVXNGLEdBQUcxRyxNQUFNcUIsVUFBVXFGLEdBQUcxRyxNQUFNbUgsWUFDbkV4RyxLQUFLLFVBQVMwRyxLQUFJO2dCQUNsQjdILE9BQU9zQyxHQUFHO2VBRVJmLE1BQU0sVUFBU3VHLElBQUc7Z0JBQ3BCWixHQUFHN0IsVUFBV3lDLEdBQUd6RyxRQUFReUcsR0FBR3pHLEtBQUtnRSxXQUFZO2VBRTNDMEMsUUFBUSxZQUFVO2dCQUNwQmIsR0FBR1UsT0FBTzs7Ozs7S0FIVDtBQ3pCTCxDQUFDLFlBQVk7SUFDVDtJQURKakksUUFBUUMsT0FBTyxpQkFBaUIsQ0FBQyxpQkFDNUIyQyxJQUFJbUU7Ozs7Ozs7Ozs7Ozs7OztJQW1CVCxTQUFTQSxPQUFPQyxnQkFBZ0I7UUFFNUJBLGVBQWV2QyxTQUFTd0M7OztJQUk1QixTQUFTQSxZQUFZO1FBQ2pCLE9BQU8sQ0FDSDtnQkFDSVQsTUFBTTtnQkFDTkksS0FBSztnQkFDTE0sWUFBWTtnQkFDWkMsY0FBYztnQkFDZEMsYUFBYTtnQkFDYmhDLFVBQVU7b0JBQ05uRixRQUFRO29CQUNSb0gsT0FBTzs7OztLQUhsQjtBQ2pDTCxDQUFDLFlBQVk7SUFDVDtJQUFKckgsUUFBUUMsT0FBTyxpQkFDVmlILFdBQVcsdUJBQXVCbUI7O0lBR3ZDLFNBQVNBLHNCQUFzQjtRQUMzQixLQUFLM0MsVUFBVTs7S0FDZDtBQ1BMLENBQUMsWUFBWTtJQUNUO0lBREoxRixRQUFRQyxPQUFPLGNBQ1ZpSCxXQUFXLG1CQUFtQm9COztJQUduQyxTQUFTQSxnQkFBZ0J0QixnQkFBZ0I7UUFFckMsSUFBSU8sS0FBSztRQUNUQSxHQUFHM0MsV0FBV29DLGVBQWVyQzs7O0tBQzVCO0FDUkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESjNFLFFBQVFDLE9BQU8sY0FDYjhELE9BQU93RSxrQkFDUDNGLElBQUk0Rjs7SUFHTixTQUFTQSxvQkFBb0IxRixZQUFZekMsUUFBUUYsaUJBQWlCc0ksVUFBVTtRQUMzRTNGLFdBQVc0RixhQUFhO1FBRXhCNUYsV0FBV0UsSUFBSSxxQkFBcUIsVUFBUzJGLEdBQUd6RixTQUFTQyxVQUFVQyxXQUFXQyxZQUFZO1lBRXpGLElBQUlILFFBQVFzRCxTQUFTLFNBQVM7O2dCQUU3Qjs7WUFHRCxJQUFJaEUsT0FBT3JDLGdCQUFnQk87WUFDM0IsSUFBSThCLE1BQU07O2dCQUVUOztZQUVEbUcsRUFBRUM7WUFFRnpJLGdCQUFnQlEscUJBQ2RhLEtBQUssVUFBU3FILEdBQUc7Z0JBRUwsSUFBSUMsY0FBY0QsSUFBSTNGLFVBQVU7Z0JBRTVDN0MsT0FBT3NDLEdBQUdtRztlQUNSbEgsTUFBTSxVQUFTdUcsSUFBSTtnQkFDckI5SCxPQUFPc0MsR0FBRzs7OztRQU1WLElBQUlvRyxpQkFBaUI7UUFDckJqRyxXQUFXRSxJQUFJLHVCQUF1QixVQUFTQyxPQUFPQyxTQUFTQyxVQUFVQyxXQUFXQyxZQUFZOzs7WUFHNUYwRixpQkFBaUI7O1FBR3hCakcsV0FBV0UsSUFBSSxzQkFBc0IsVUFBUzJGLEdBQUc7WUFFMUMsSUFBR0ksZ0JBQWU7Z0JBQ2RBLGlCQUFpQjtnQkFFN0J6RixRQUFRQyxJQUFJO2dCQUNBa0YsU0FBUyxZQUFVO29CQUNmbkYsUUFBUUMsSUFBSTtvQkFDWlQsV0FBVzRGLGFBQWE7bUJBQ3pCOzs7Ozs7SUFRZixTQUFTSCxpQkFBaUIxRSxnQkFBZ0JtRixvQkFBb0I7UUFFN0RBLG1CQUFtQkMsVUFBVTtRQUc3QnBGLGVBQ0VpQixNQUFNLFFBQVE7WUFDZDhCLEtBQUs7WUFDTHNDLFVBQVU7WUFDVkMsVUFBVTtZQUNWakMscUNBQVksVUFBU2tDLFFBQVF0RyxZQUFZO2dCQUV4QyxJQUFJQSxXQUFXNEYsZUFBZTFEO29CQUM3QmxDLFdBQVc0RixhQUFhOztZQUUxQi9HLFNBQVM7O2dCQUVSYSwwQkFBTSxVQUFTckMsaUJBQWlCO29CQUMvQixPQUFPQSxnQkFBZ0JROzs7WUFHekIwSTsrQkFBeUIsVUFBU2hKLFFBQVFtQyxNQUFNOztXQU9oRHNDLE1BQU0sU0FBUzs7WUFFZm9DLFlBQVk7WUFDWkMsY0FBYztZQUNkQyxhQUFhO1dBRWJ0QyxNQUFNLFlBQVk7O1lBRWxCQyxRQUFRO1lBQ1JtRSxVQUFVO1lBQ1ZoQyxZQUFZO1lBQ1pFLGFBQWE7WUFDYnpGLFNBQVM7WUFHVDBILFNBQVMsWUFBVztnQkFDbkIvRixRQUFRQyxJQUFJOzs7OztLQXhCWCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3VyaXR5JywgW10pXHJcbiAgICAuZmFjdG9yeSgnc2VjdXJpdHlTZXJ2aWNlJywgc2VjdXJpdHlTZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN1cml0eVNlcnZpY2Uoc3RvcmFnZVNlcnZpY2UsICRzdGF0ZSwgaHR0cENsaWVudCwgJHEpIHtcclxuXHJcbiAgICB2YXIgX2N1cnJlbnRVc2VyID0gbnVsbDtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBjdXJyZW50VXNlcjogZnVuY3Rpb24oKXtyZXR1cm4gX2N1cnJlbnRVc2VyO30sXHJcbiAgICAgICAgcmVxdWVzdEN1cnJlbnRVc2VyOiBfcmVxdWVzdEN1cnJlbnRVc2VyLFxyXG5cclxuICAgICAgICBsb2dpbjogX2xvZ2luLFxyXG4gICAgICAgIGxvZ291dDogX2xvZ291dFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbikge1xyXG5cclxuICAgICAgICBpZiAoX2N1cnJlbnRVc2VyKVxyXG4gICAgICAgICAgICByZXR1cm4gJHEud2hlbihfY3VycmVudFVzZXIpO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHRva2VuKVxyXG4gICAgICAgICAgICBvcHRpb25zLmF1dGggPSB7XHJcbiAgICAgICAgICAgICAgICAnQmVhcmVyJzogdG9rZW5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICAgICAgaHR0cENsaWVudC5nZXQoJy90b2tlbnMvY3VycmVudCcsIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgX2N1cnJlbnRVc2VyID0gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QocmVzKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQsIHBlcnNpc3QpIHtcclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSBidG9hKHVzZXJuYW1lICsgXCI6XCIgKyBwYXNzd29yZCk7XHJcbiAgICAgICAgdmFyIHRva2VuID0gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQucG9zdCgnL3Rva2VucycsIG51bGwsIHtcclxuICAgICAgICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgICAgICAgICAnQmFzaWMnOiB0ZXh0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG4gICAgICAgICAgICAgICAgdG9rZW4gPSByZXMuZGF0YS5hdXRoX3Rva2VuO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBfcmVxdWVzdEN1cnJlbnRVc2VyKHRva2VuKTtcclxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlU2VydmljZS5zZXQoXCJhdXRoLXRva2VuXCIsIHRva2VuLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9nb3V0KCkge1xyXG4gICAgICAgIHN0b3JhZ2VTZXJ2aWNlLnJlbW92ZSgndG9rZW4nKTtcclxuICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnLCBbJ3VpLnJvdXRlciddKTtcclxuXHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJykucnVuKGRlYnVnUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBkZWJ1Z1JvdXRlcygkcm9vdFNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xyXG4gICAgLy8gQ3JlZGl0czogQWRhbSdzIGFuc3dlciBpbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMDc4NjI2Mi82OTM2MlxyXG4gICAgLy8gUGFzdGUgdGhpcyBpbiBicm93c2VyJ3MgY29uc29sZVxyXG5cclxuICAgIC8vdmFyICRyb290U2NvcGUgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIlt1aS12aWV3XVwiKVswXSkuaW5qZWN0b3IoKS5nZXQoJyRyb290U2NvcGUnKTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZSA9ICRzdGF0ZTtcclxuICAgICRyb290U2NvcGUuJHN0YXRlUGFyYW1zID0gJHN0YXRlUGFyYW1zO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VFcnJvcicsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VFcnJvciAtIGZpcmVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzIGR1cmluZyB0cmFuc2l0aW9uLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGFyZ3VtZW50cyk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVOb3RGb3VuZCAnICsgdW5mb3VuZFN0YXRlLnRvICsgJyAgLSBmaXJlZCB3aGVuIGEgc3RhdGUgY2Fubm90IGJlIGZvdW5kIGJ5IGl0cyBuYW1lLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VTdGFydCB0byAnICsgdG9TdGF0ZS50byArICctIGZpcmVkIHdoZW4gdGhlIHRyYW5zaXRpb24gYmVnaW5zLiB0b1N0YXRlLHRvUGFyYW1zIDogXFxuJywgdG9TdGF0ZSwgdG9QYXJhbXMpO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3VjY2VzcyB0byAnICsgdG9TdGF0ZS5uYW1lICsgJy0gZmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZS4nKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHZpZXdDb250ZW50TG9hZGVkIC0gZmlyZWQgYWZ0ZXIgZG9tIHJlbmRlcmVkJywgZXZlbnQpO1xyXG4gICAgLy8gfSk7XHJcblxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJylcclxuXHQucHJvdmlkZXIoJ3NlY3Rpb25NYW5hZ2VyJywgc2VjdGlvbk1hbmFnZXJQcm92aWRlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdGlvbk1hbmFnZXJQcm92aWRlcigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcclxuXHJcblx0dmFyIGNvbmZpZyA9IHtcclxuXHRcdHJlc29sdmVBbHdheXM6IHt9XHJcblx0fTtcclxuXHJcblx0dGhpcy5jb25maWd1cmUgPSBmdW5jdGlvbiAob3B0cykge1xyXG5cdFx0YW5ndWxhci5leHRlbmQoY29uZmlnLCBvcHRzKTtcclxuXHR9O1xyXG5cclxuXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XHJcblxyXG5cclxuXHR0aGlzLiRnZXQgPSBTZWN0aW9uTWFuYWdlclNlcnZpY2U7XHJcblxyXG5cdC8vIEBuZ0luamVjdFxyXG5cdGZ1bmN0aW9uIFNlY3Rpb25NYW5hZ2VyU2VydmljZSgkcm9vdFNjb3BlLCAkc3RhdGUpIHtcclxuXHJcblx0ICAgIHZhciBfc2VjdGlvbnMgPSBbXTtcclxuXHJcblx0XHR2YXIgc2VydmljZSA9IHtcclxuXHRcdFx0Z2V0U2VjdGlvbnM6IGdldFNlY3Rpb25zLFxyXG5cdFx0XHRyZWdpc3RlcjogcmVnaXN0ZXJTZWN0aW9ucyxcclxuICAgICAgICAgICAgZ2V0TW9kdWxlczogZ2V0TW9kdWxlc1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWdpc3RlclNlY3Rpb25zKHNlY3Rpb25zKSB7XHJcblx0XHRcdHNlY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlKSB7XHJcblxyXG5cdFx0XHRcdGlmKHN0YXRlLnBhcmVudCA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0c3RhdGUucGFyZW50ID0gJ2FwcC1yb290JztcclxuXHJcblx0XHRcdFx0c3RhdGUucmVzb2x2ZSA9XHJcblx0XHRcdFx0XHRhbmd1bGFyLmV4dGVuZChzdGF0ZS5yZXNvbHZlIHx8IHt9LCBjb25maWcucmVzb2x2ZUFsd2F5cyk7XHJcblx0XHRcdFx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoc3RhdGUpO1xyXG5cdFx0XHRcdF9zZWN0aW9ucy5wdXNoKHN0YXRlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlcygpIHtcclxuXHRcdCAgICByZXR1cm4gJHN0YXRlLmdldCgpLmZpbHRlcihmdW5jdGlvbiAoeCkge1xyXG5cdFx0ICAgICAgICByZXR1cm4geC5zZXR0aW5ncyAmJiB4LnNldHRpbmdzLm1vZHVsZTtcclxuXHRcdCAgICB9KTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRTZWN0aW9ucygpIHtcclxuXHRcdCAgICAvL3JldHVybiAkc3RhdGUuZ2V0KCk7XHJcblx0XHQgICAgcmV0dXJuIF9zZWN0aW9ucztcclxuXHRcdH1cclxuXHJcblx0fVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnLCBbXSk7IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycpXHJcbiAgICAuc2VydmljZSgnbG9nZ2VyJywgbG9nZ2VyU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gbG9nZ2VyU2VydmljZSgkbG9nKSB7XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgaW5mbzogaW5mbyxcclxuICAgICAgICB3YXJuaW5nOiB3YXJuaW5nLFxyXG4gICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICBsb2c6ICRsb2dcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGluZm8obWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuaW5mbygnSW5mbzogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHdhcm5pbmcobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuaW5mbygnV0FSTklORzogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmVycm9yKCdFUlJPUjogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nLFxyXG4gICAgW1xyXG4gICAgICAgICdhcHAubGF5b3V0JyxcclxuICAgICAgICAnYXBwLmxvZ2dpbmcnLFxyXG4gICAgICAgICdhcHAuc2VjdGlvbnMnLFxyXG4gICAgICAgICdhcHAuc2VjdXJpdHknLFxyXG4gICAgICAgICdzb2xvbW9uLnBhcnRpYWxzJyxcclxuICAgICAgICAnYXBwLmRhc2hib2FyZCcsXHJcbiAgICAgICAgJ2FwcC5zdG9yZXMnLFxyXG4gICAgICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgICAgICduZ0FuaW1hdGUnXHJcbiAgICBdKTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJylcclxuLmNvbmZpZyhjb25maWcpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGNvbmZpZyhodHRwQ2xpZW50UHJvdmlkZXIsICRodHRwUHJvdmlkZXIpe1xyXG5cdGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIjtcclxuXHJcbiAgICAgICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcclxuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcclxuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuY2FjaGUgPSB0cnVlO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG5cdC5kaXJlY3RpdmUoJ3VpU3RhdGUnLCB1aVN0YXRlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiB1aVN0YXRlKCRzdGF0ZSkge1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdBJyxcclxuXHRcdGxpbms6IGxpbmssXHJcblxyXG5cdH07XHJcbiBcclxuXHRmdW5jdGlvbiBsaW5rKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnLCBbJ3VpLnJvdXRlciddKVxyXG4ucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdzdG9yZXMnLFxyXG4gICAgICAgICAgICB1cmw6ICcvc3RvcmVzJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0b3Jlc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3N0b3Jlcy9zdG9yZXMuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJylcclxuLmNvbnRyb2xsZXIoJ1N0b3Jlc0NvbnRyb2xsZXInLCBTdG9yZXNDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIFN0b3Jlc0NvbnRyb2xsZXIoaHR0cENsaWVudCl7XHJcblx0XHJcblx0dmFyIHZtID0gdGhpcztcclxuXHJcblx0dm0uc3RvcmVzID0gW107XHJcblx0dm0uc2VsZWN0ZWQgPSBudWxsO1xyXG5cdHZtLnRhc2tzID0gW107XHJcblxyXG5cdHZtLnNlbGVjdCA9IGZ1bmN0aW9uKHN0b3JlKXtcclxuXHRcdHZtLnNlbGVjdGVkID0gc3RvcmU7XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLl9pZCArICcvdGFza3MnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnRhc2tzID0geC5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnN0b3JlcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JywgWyd1aS5ib290c3RyYXAnLCAndWkucm91dGVyJ10pOyAiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoW1xyXG5cclxuICAgIF0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIExvZ2luQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gTG9naW5Db250cm9sbGVyKHNlY3VyaXR5U2VydmljZSwgJHN0YXRlKXtcclxuXHRcclxuXHR2YXIgdm0gPXRoaXM7XHJcblx0dm0ubG9naW4gPSB7XHJcblx0XHR1c2VybmFtZTogXCJcIixcclxuXHRcdHBhc3N3b3JkOiBcIlwiLFxyXG5cdFx0cmVtZW1iZXJNZTogZmFsc2VcclxuXHR9O1xyXG5cclxuXHR0aGlzLmJ1c3kgPSBmYWxzZTtcclxuXHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHR0aGlzLmxvZ2luID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYnVzeSA9IHRydWU7XHJcblx0XHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5sb2dpbih2bS5sb2dpbi51c2VybmFtZSwgdm0ubG9naW4ucGFzc3dvcmQsIHZtLmxvZ2luLnJlbWVtYmVyTWUpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcclxuXHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KXtcclxuXHRcdFx0XHR2bS5tZXNzYWdlID0gKGV4LmRhdGEgJiYgZXguZGF0YS5tZXNzYWdlKSB8fCBcIlVuYWJsZSB0byBsb2cgaW5cIjtcclxuXHJcblx0XHRcdH0pLmZpbmFsbHkoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2bS5idXN5ID0gZmFsc2U7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9O1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAuY29udHJvbGxlcignU2hlbGxDb250cm9sbGVyJywgU2hlbGxDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTaGVsbENvbnRyb2xsZXIoc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICB2YXIgdm0gPSB0aGlzO1xyXG4gICAgdm0uc2VjdGlvbnMgPSBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKCk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb25maWcoaW5pdGlhbGl6ZVN0YXRlcylcclxuXHQucnVuKGVuc3VyZUF1dGhlbnRpY2F0ZWQpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGVuc3VyZUF1dGhlbnRpY2F0ZWQoJHJvb3RTY29wZSwgJHN0YXRlLCBzZWN1cml0eVNlcnZpY2UsICR0aW1lb3V0KSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdFx0Ly8kcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB1c2VyID0gc2VjdXJpdHlTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XHJcblx0XHRpZiAodXNlcikge1xyXG5cdFx0XHQvLyRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0XHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0XHR9KVxyXG5cclxuXHRcdC8vY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN0YXJ0IHRvICcgKyB0b1N0YXRlLnRvICsgJy0gZmlyZWQgd2hlbiB0aGUgdHJhbnNpdGlvbiBiZWdpbnMuIHRvU3RhdGUsdG9QYXJhbXMgOiBcXG4nLCB0b1N0YXRlLCB0b1BhcmFtcyk7XHJcblx0fSk7XHJcblxyXG4gICAgdmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3VjY2VzcyB0byAnICsgdG9TdGF0ZS5uYW1lICsgJy0gZmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZS4nKTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdGF0ZS5zdWNjZXNzOiAnICsgdG9TdGF0ZS5uYW1lKTtcclxuICAgICAgICB3YWl0aW5nRm9yVmlldyA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cdFx0XHJcbiAgICAgICAgaWYod2FpdGluZ0ZvclZpZXcpe1xyXG4gICAgICAgICAgICB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuY29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93U3BsYXNoID0gZmFsc2UnKTtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdFx0dXJsOiAnJyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PicsXHJcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5zaG93U3BsYXNoID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly8gQG5nSW5qZWN0XHJcblx0XHRcdFx0dXNlcjogZnVuY3Rpb24oc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogLyogQG5nSW5qZWN0ICovIGZ1bmN0aW9uKCRzdGF0ZSwgdXNlcikge1xyXG5cdFx0XHRcdC8vIGlmKHVzZXIpXHJcblx0XHRcdFx0Ly8gICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0XHQvLyB1cmw6ICcnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiBcInZtXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xvZ2luL2xvZ2luLmh0bWwnXHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuXHRcdFx0Ly91cmw6ICcnLFxyXG5cdFx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvL3VzZXI6IGZ1bmN0aW9uKClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9