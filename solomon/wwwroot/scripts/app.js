(function () {
    'use strict';
    angular.module('app.security', []).factory('securityService', securityService);
    /* @ngInject */
    function securityService(storageService, $state, httpClient, $q) {
        var _currentUser = null;
        var _listeners = {};
        var service = {
            currentUser: function () {
                return _currentUser;
            },
            requestCurrentUser: _requestCurrentUser,
            on: addListener,
            login: _login,
            logout: _logout
        };
        return service;
        function addListener(eventName, listener) {
            if (!_listeners[eventName])
                _listeners[eventName] = [];
            _listeners[eventName].push(listener);
        }
        function fireEvent(eventName, args) {
            var handler = _listeners[eventName];
            if (!handler)
                return;
            var eventArgs = [].splice.call(args, 1);
            handler.forEach(function (cb) {
                cb(eventArgs);
            });
        }
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
        function _setUser(user) {
            _currentUser = user;
            fireEvent('userChanged', user);
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
        'app.data',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'app.tasks',
        'app.employees',
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
            link: link,
            require: '?^uiSrefActive'
        };
        function link(scope, element, attrs, uiSrefActive) {
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
    angular.module('app.data', []);
}());
(function () {
    'use strict';
    angular.module('app.data').factory('util', UtilService);
    function UtilService(eventService) {
        var service = { addProperty: addProperty };
        return service;
        function addProperty(obj, name, getter, setter) {
            Object.defineProperty(obj, name, {
                get: getter || createGetter(obj, name),
                set: setter || createSetter(obj, name)
            });
            function createGetter(obj, name) {
                var field = '_' + name;
                return function () {
                    return obj[field];
                };
            }
            function createSetter(obj, name) {
                var field = '_' + name;
                return function (value) {
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
    UtilService.$inject = ["eventService"];
}());
(function () {
    'use strict';
    angular.module('app.data').factory('storeService', StoreService);
    /* @ngInject */
    function StoreService(httpClient, eventService, $q) {
        var _currentStore;
        var _currentOrg;
        var service = {
            getOrgs: getOrgs,
            getStores: getStores
        };
        Object.defineProperty(service, 'currentOrg', {
            enumerable: true,
            get: get_currentOrg,
            set: set_currentOrg
        });
        Object.defineProperty(service, 'currentStore', {
            get: get_currentStore,
            set: set_currentStore
        });
        return service;
        function getOrgs() {
            return httpClient.get('/organizations').then(function (res) {
                return res.data;
            });
        }
        function getStores(org) {
            if (!org || !org._id)
                return $q.when([]);
            return httpClient.get('/organizations/' + org._id + '/stores').then(function (res) {
                return res.data;
            });
        }
        function get_currentOrg() {
            return _currentOrg;
        }
        function set_currentOrg(value) {
            if (_currentOrg === value)
                return;
            _currentOrg = value;
            eventService.raise('orgChanged', _currentOrg);
        }
        function get_currentStore() {
            return _currentStore;
        }
        function set_currentStore(value) {
            if (_currentStore === value)
                return;
            _currentStore = value;
            eventService.raise('storeChanged', _currentStore);
        }
    }
    StoreService.$inject = ["httpClient", "eventService", "$q"];
}());
(function () {
    'use strict';
    angular.module('app.tasks', ['app.data']);
}());
(function () {
    'use strict';
    angular.module('app.tasks').run(appRun);
    /* @ngInject */
    function appRun(sectionManager) {
        sectionManager.register(getStates());
    }
    appRun.$inject = ["sectionManager"];
    function getStates() {
        return [{
                name: 'tasks',
                url: '/tasks',
                controller: 'TaskListController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/tasks/tasklist.html',
                settings: {
                    module: true,
                    order: 3,
                    icon: [
                        'glyphicon',
                        'glyphicon-tags'
                    ]
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.tasks').controller('TaskListController', TaskListController);
    /* @ngInject */
    function TaskListController(storeService, httpClient, eventService) {
        var vm = angular.extend(this, { tasks: null });
        eventService.on('storeChanged', onStoreChanged);
        refreshTasks(storeService.currentStore);
        function onStoreChanged(e, store) {
            refreshTasks(store);
        }
        function refreshTasks(store) {
            if (!store) {
                vm.tasks = [];
                return;
            }
            httpClient.get('/stores/' + store.id + '/tasks').then(function (res) {
                vm.tasks = res.data;
            });
        }
    }
    TaskListController.$inject = ["storeService", "httpClient", "eventService"];
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
                    order: 2,
                    icon: [
                        'glyphicon',
                        'glyphicon-map-marker'
                    ]
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
    angular.module('app.employees', ['app.data']);
}());
(function () {
    'use strict';
    angular.module('app.employees').run(configureRoutes);
    // @ngInject
    function configureRoutes(sectionManager) {
        sectionManager.register(getRoutes());
    }
    configureRoutes.$inject = ["sectionManager"];
    function getRoutes() {
        return [{
                name: 'employees',
                url: '/employees',
                controller: 'EmployeesController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/employees/employees.html',
                settings: {
                    module: true,
                    order: 4,
                    icon: [
                        'fa',
                        'fa-users'
                    ]
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.employees').controller('EmployeesController', EmployeesController);
    /* @ngInject */
    function EmployeesController(storeService, eventService, httpClient) {
        var vm = angular.extend(this, { employees: [] });
        eventService.on('storeChanged', onStoreChanged);
        // refreshEmployees(storeService.currentStore);
        function onStoreChanged(e, store) {
            refreshEmployees(store);
        }
        function refreshEmployees(store) {
            if (!store) {
                vm.employees = [];
                return;
            }
            httpClient.get('/stores/' + store.id + '/employees').then(function (res) {
                vm.employees = res.data;
            });
        }
    }
    EmployeesController.$inject = ["storeService", "eventService", "httpClient"];
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
                    order: 1,
                    icon: [
                        'glyphicon',
                        'glyphicon-stats'
                    ]
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
    angular.module('app.layout').controller('AsideController', AsideController);
    /* @ngInject */
    function AsideController(sectionManager) {
        var vm = angular.extend(this, { sections: sectionManager.getModules() });    //vm.sections = sectionManager.getModules();
    }
    AsideController.$inject = ["sectionManager"];
}());
(function () {
    'use strict';
    angular.module('app.layout').controller('ShellController', ShellController);
    /* @ngInject */
    function ShellController(sectionManager) {
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
                return;
            }
            var user = securityService.currentUser();
            if (user) {
                return;
            }
            e.preventDefault();
            securityService.requestCurrentUser().then(function (u) {
                var targetState = u ? toState : 'login';
                $state.go(targetState);
            }).catch(function (ex) {
                $state.go('login');
            });
        });
        var waitingForView = false;
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            if (!$rootScope.showSplash)
                return;
            waitingForView = true;
        });
        $rootScope.$on('$viewContentLoaded', function (e) {
            if (waitingForView && $rootScope.showSplash) {
                waitingForView = false;
                console.log('give time to render');
                $timeout(function () {
                    console.log('showSplash = false');
                    $rootScope.showSplash = false;
                }, 10);
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
(function () {
    'use strict';
    angular.module('app.layout').controller('HeaderController', HeaderController);
    /* @ngInject */
    function HeaderController(securityService, storeService, eventService, util) {
        var vm = angular.extend(this, {
            message: 'Hello Header',
            user: securityService.currentUser,
            orgs: [],
            stores: []
        });
        Object.defineProperty(vm, 'org', {
            get: function () {
                return storeService.currentOrg;
            },
            set: function (value) {
                storeService.currentOrg = value;
            }
        });
        Object.defineProperty(vm, 'store', {
            get: function () {
                return storeService.currentStore;
            },
            set: function (value) {
                storeService.currentStore = value;
            }
        });
        //util.addProperty(vm, 'org');
        //util.addProperty(vm, 'store');
        init();
        function init() {
            securityService.requestCurrentUser().then(function (x) {
                vm.user = x;
            });
            securityService.on('userChanged', handleUserChanged);
            storeService.getOrgs().then(function (orgs) {
                vm.orgs = orgs;
                storeService.currentOrg = vm.orgs[0];
                refreshStores(vm.orgs[0]);
            });
            eventService.on('orgChanged', function (e, org) {
                //vm.org = org;
                refreshStores(org);
            });
        }
        function refreshStores(org) {
            return storeService.getStores(org).then(function (stores) {
                vm.stores = stores;
                storeService.currentStore = vm.stores[0];
            });
        }
        function handleUserChanged(user) {
            vm.user = user;
        }
    }
    HeaderController.$inject = ["securityService", "storeService", "eventService", "util"];
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJjb21tb24vZGF0YS9kYXRhLm1vZHVsZS5qcyIsImNvbW1vbi9kYXRhL3V0aWwuanMiLCJjb21tb24vZGF0YS9zdG9yZVNlcnZpY2UuanMiLCJhcmVhcy90YXNrcy90YXNrcy5tb2R1bGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5yb3V0ZXMuanMiLCJhcmVhcy90YXNrcy90YXNrbGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMubW9kdWxlLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5yb3V0ZXMuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImFyZWFzL2FzaWRlL2FzaWRlLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwibGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5Iiwic2VjdXJpdHlTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJfbGlzdGVuZXJzIiwic2VydmljZSIsImN1cnJlbnRVc2VyIiwicmVxdWVzdEN1cnJlbnRVc2VyIiwiX3JlcXVlc3RDdXJyZW50VXNlciIsIm9uIiwiYWRkTGlzdGVuZXIiLCJsb2dpbiIsIl9sb2dpbiIsImxvZ291dCIsIl9sb2dvdXQiLCJldmVudE5hbWUiLCJsaXN0ZW5lciIsInB1c2giLCJmaXJlRXZlbnQiLCJhcmdzIiwiaGFuZGxlciIsImV2ZW50QXJncyIsInNwbGljZSIsImNhbGwiLCJmb3JFYWNoIiwiY2IiLCJ0b2tlbiIsIndoZW4iLCJvcHRpb25zIiwiY2FjaGUiLCJhdXRoIiwiZGVmZXIiLCJnZXQiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwicmVzb2x2ZSIsImNhdGNoIiwicmVzIiwic3RhdHVzIiwicmVqZWN0IiwicHJvbWlzZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJwZXJzaXN0IiwidGV4dCIsImJ0b2EiLCJwb3N0IiwiYXV0aF90b2tlbiIsInVzZXIiLCJzZXQiLCJyZW1vdmUiLCJnbyIsIl9zZXRVc2VyIiwicnVuIiwiZGVidWdSb3V0ZXMiLCIkcm9vdFNjb3BlIiwiJHN0YXRlUGFyYW1zIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJmcm9tU3RhdGUiLCJmcm9tUGFyYW1zIiwiY29uc29sZSIsImxvZyIsImFyZ3VtZW50cyIsInVuZm91bmRTdGF0ZSIsInRvIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsImdldFNlY3Rpb25zIiwicmVnaXN0ZXIiLCJyZWdpc3RlclNlY3Rpb25zIiwiZ2V0TW9kdWxlcyIsInNlY3Rpb25zIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJ4Iiwic2V0dGluZ3MiLCJsb2dnZXJTZXJ2aWNlIiwiJGxvZyIsImluZm8iLCJ3YXJuaW5nIiwiZXJyb3IiLCJtZXNzYWdlIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsImJhc2VVcmkiLCJkZWZhdWx0cyIsInVzZVhEb21haW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJkaXJlY3RpdmUiLCJ1aVN0YXRlIiwicmVzdHJpY3QiLCJsaW5rIiwicmVxdWlyZSIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwidWlTcmVmQWN0aXZlIiwibmFtZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiVXRpbFNlcnZpY2UiLCJldmVudFNlcnZpY2UiLCJhZGRQcm9wZXJ0eSIsIm9iaiIsImdldHRlciIsInNldHRlciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiY3JlYXRlR2V0dGVyIiwiY3JlYXRlU2V0dGVyIiwiZmllbGQiLCJ2YWx1ZSIsIm9sZFZhbHVlIiwicmFpc2UiLCJvcmlnaW5hbFZhbHVlIiwiU3RvcmVTZXJ2aWNlIiwiX2N1cnJlbnRTdG9yZSIsIl9jdXJyZW50T3JnIiwiZ2V0T3JncyIsImdldFN0b3JlcyIsImVudW1lcmFibGUiLCJnZXRfY3VycmVudE9yZyIsInNldF9jdXJyZW50T3JnIiwiZ2V0X2N1cnJlbnRTdG9yZSIsInNldF9jdXJyZW50U3RvcmUiLCJvcmciLCJfaWQiLCJhcHBSdW4iLCJzZWN0aW9uTWFuYWdlciIsImdldFN0YXRlcyIsImNvbnRyb2xsZXIiLCJjb250cm9sbGVyQXMiLCJ0ZW1wbGF0ZVVybCIsIm9yZGVyIiwiaWNvbiIsIlRhc2tMaXN0Q29udHJvbGxlciIsInN0b3JlU2VydmljZSIsInZtIiwidGFza3MiLCJvblN0b3JlQ2hhbmdlZCIsInJlZnJlc2hUYXNrcyIsImN1cnJlbnRTdG9yZSIsImUiLCJzdG9yZSIsImlkIiwiU3RvcmVzQ29udHJvbGxlciIsInN0b3JlcyIsInNlbGVjdGVkIiwic2VsZWN0IiwiaW5pdCIsIkxvZ2luQ29udHJvbGxlciIsInJlbWVtYmVyTWUiLCJidXN5IiwicmV0IiwiZXgiLCJmaW5hbGx5IiwiY29uZmlndXJlUm91dGVzIiwiZ2V0Um91dGVzIiwiRW1wbG95ZWVzQ29udHJvbGxlciIsImVtcGxveWVlcyIsInJlZnJlc2hFbXBsb3llZXMiLCJEYXNoYm9hcmRDb250cm9sbGVyIiwiQXNpZGVDb250cm9sbGVyIiwiU2hlbGxDb250cm9sbGVyIiwiaW5pdGlhbGl6ZVN0YXRlcyIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsInNob3dTcGxhc2giLCJwcmV2ZW50RGVmYXVsdCIsInUiLCJ0YXJnZXRTdGF0ZSIsIndhaXRpbmdGb3JWaWV3IiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwiYWJzdHJhY3QiLCJ0ZW1wbGF0ZSIsIiRzY29wZSIsIm9uRW50ZXIiLCJIZWFkZXJDb250cm9sbGVyIiwidXRpbCIsIm9yZ3MiLCJjdXJyZW50T3JnIiwiaGFuZGxlVXNlckNoYW5nZWQiLCJyZWZyZXNoU3RvcmVzIl0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQURKQSxRQUFRQyxPQUFPLGdCQUFnQixJQUMxQkMsUUFBUSxtQkFBbUJDOztJQUdoQyxTQUFTQSxnQkFBZ0JDLGdCQUFnQkMsUUFBUUMsWUFBWUMsSUFBSTtRQUU3RCxJQUFJQyxlQUFlO1FBQ25CLElBQUlDLGFBQWE7UUFFakIsSUFBSUMsVUFBVTtZQUNWQyxhQUFhLFlBQVU7Z0JBQUMsT0FBT0g7O1lBQy9CSSxvQkFBb0JDO1lBRXBCQyxJQUFJQztZQUVKQyxPQUFPQztZQUNQQyxRQUFRQzs7UUFHWixPQUFPVDtRQUVQLFNBQVNLLFlBQVlL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LEtBQUs7Z0JBQ2xDRyxjQUFjOUMsR0FBRzJDLEtBQUs7O1lBR3ZCL0UsYUFBYWpILEdBQUcsY0FBYyxVQUFTMEosR0FBR2pCLEtBQUk7O2dCQUU3QzBELGNBQWMxRDs7O1FBTWhCLFNBQVMwRCxjQUFjMUQsS0FBSTtZQUMxQixPQUFPVyxhQUFhakIsVUFBVU0sS0FDNUJqSCxLQUFLLFVBQVNzSSxRQUFPO2dCQUNyQlQsR0FBR1MsU0FBU0E7Z0JBQ1pWLGFBQWFLLGVBQWVKLEdBQUdTLE9BQU87OztRQUl6QyxTQUFTb0Msa0JBQWtCMUosTUFBTTtZQUNoQzZHLEdBQUc3RyxPQUFPQTs7OztLQUxQIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdXJpdHknLCBbXSlcclxuICAgIC5mYWN0b3J5KCdzZWN1cml0eVNlcnZpY2UnLCBzZWN1cml0eVNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3VyaXR5U2VydmljZShzdG9yYWdlU2VydmljZSwgJHN0YXRlLCBodHRwQ2xpZW50LCAkcSkge1xyXG5cclxuICAgIHZhciBfY3VycmVudFVzZXIgPSBudWxsO1xyXG4gICAgdmFyIF9saXN0ZW5lcnMgPSB7fTtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBjdXJyZW50VXNlcjogZnVuY3Rpb24oKXtyZXR1cm4gX2N1cnJlbnRVc2VyO30sXHJcbiAgICAgICAgcmVxdWVzdEN1cnJlbnRVc2VyOiBfcmVxdWVzdEN1cnJlbnRVc2VyLFxyXG5cclxuICAgICAgICBvbjogYWRkTGlzdGVuZXIsXHJcblxyXG4gICAgICAgIGxvZ2luOiBfbG9naW4sXHJcbiAgICAgICAgbG9nb3V0OiBfbG9nb3V0XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpe1xyXG4gICAgICAgIGlmKCFfbGlzdGVuZXJzW2V2ZW50TmFtZV0pXHJcbiAgICAgICAgICAgIF9saXN0ZW5lcnNbZXZlbnROYW1lXSA9IFtdO1xyXG4gICAgICAgIF9saXN0ZW5lcnNbZXZlbnROYW1lXS5wdXNoKGxpc3RlbmVyKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGZpcmVFdmVudChldmVudE5hbWUsIGFyZ3Mpe1xyXG4gICAgICAgIHZhciBoYW5kbGVyID0gX2xpc3RlbmVyc1tldmVudE5hbWVdO1xyXG4gICAgICAgIGlmKCFoYW5kbGVyKSBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgZXZlbnRBcmdzID0gW10uc3BsaWNlLmNhbGwoYXJncywgMSk7XHJcbiAgICAgICAgaGFuZGxlci5mb3JFYWNoKGZ1bmN0aW9uKGNiKXtcclxuICAgICAgICAgICAgY2IoZXZlbnRBcmdzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfcmVxdWVzdEN1cnJlbnRVc2VyKHRva2VuKSB7XHJcblxyXG4gICAgICAgIGlmIChfY3VycmVudFVzZXIpXHJcbiAgICAgICAgICAgIHJldHVybiAkcS53aGVuKF9jdXJyZW50VXNlcik7XHJcblxyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAodG9rZW4pXHJcbiAgICAgICAgICAgIG9wdGlvbnMuYXV0aCA9IHtcclxuICAgICAgICAgICAgICAgICdCZWFyZXInOiB0b2tlblxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgICAgICBodHRwQ2xpZW50LmdldCgnL3Rva2Vucy9jdXJyZW50Jywgb3B0aW9ucylcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBfY3VycmVudFVzZXIgPSByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChyZXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCwgcGVyc2lzdCkge1xyXG5cclxuICAgICAgICB2YXIgdGV4dCA9IGJ0b2EodXNlcm5hbWUgKyBcIjpcIiArIHBhc3N3b3JkKTtcclxuICAgICAgICB2YXIgdG9rZW4gPSBudWxsO1xyXG5cclxuICAgICAgICByZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvdG9rZW5zJywgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICdCYXNpYyc6IHRleHRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICB0b2tlbiA9IHJlcy5kYXRhLmF1dGhfdG9rZW47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pO1xyXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VTZXJ2aWNlLnNldChcImF1dGgtdG9rZW5cIiwgdG9rZW4sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dvdXQoKSB7XHJcbiAgICAgICAgc3RvcmFnZVNlcnZpY2UucmVtb3ZlKCd0b2tlbicpO1xyXG4gICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfc2V0VXNlcih1c2VyKXtcclxuICAgICAgICBfY3VycmVudFVzZXIgPSB1c2VyO1xyXG4gICAgICAgIGZpcmVFdmVudCgndXNlckNoYW5nZWQnLCB1c2VyKTtcclxuICAgIH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycsIFsndWkucm91dGVyJ10pO1xyXG5cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKS5ydW4oZGVidWdSb3V0ZXMpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGRlYnVnUm91dGVzKCRyb290U2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICAvLyBDcmVkaXRzOiBBZGFtJ3MgYW5zd2VyIGluIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIwNzg2MjYyLzY5MzYyXHJcbiAgICAvLyBQYXN0ZSB0aGlzIGluIGJyb3dzZXIncyBjb25zb2xlXHJcblxyXG4gICAgLy92YXIgJHJvb3RTY29wZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW3VpLXZpZXddXCIpWzBdKS5pbmplY3RvcigpLmdldCgnJHJvb3RTY29wZScpO1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG4gICAgJHJvb3RTY29wZS4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZUVycm9yJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZUVycm9yIC0gZmlyZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMgZHVyaW5nIHRyYW5zaXRpb24uJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlTm90Rm91bmQnLCBmdW5jdGlvbiAoZXZlbnQsIHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZU5vdEZvdW5kICcgKyB1bmZvdW5kU3RhdGUudG8gKyAnICAtIGZpcmVkIHdoZW4gYSBzdGF0ZSBjYW5ub3QgYmUgZm91bmQgYnkgaXRzIG5hbWUuJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN0YXJ0IHRvICcgKyB0b1N0YXRlLnRvICsgJy0gZmlyZWQgd2hlbiB0aGUgdHJhbnNpdGlvbiBiZWdpbnMuIHRvU3RhdGUsdG9QYXJhbXMgOiBcXG4nLCB0b1N0YXRlLCB0b1BhcmFtcyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VTdWNjZXNzIHRvICcgKyB0b1N0YXRlLm5hbWUgKyAnLSBmaXJlZCBvbmNlIHRoZSBzdGF0ZSB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLicpO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckdmlld0NvbnRlbnRMb2FkZWQgLSBmaXJlZCBhZnRlciBkb20gcmVuZGVyZWQnLCBldmVudCk7XHJcbiAgICAvLyB9KTtcclxuXHJcblxyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKVxyXG5cdC5wcm92aWRlcignc2VjdGlvbk1hbmFnZXInLCBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG5cclxuXHR2YXIgY29uZmlnID0ge1xyXG5cdFx0cmVzb2x2ZUFsd2F5czoge31cclxuXHR9O1xyXG5cclxuXHR0aGlzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcblx0XHRhbmd1bGFyLmV4dGVuZChjb25maWcsIG9wdHMpO1xyXG5cdH07XHJcblxyXG5cdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcclxuXHJcblxyXG5cdHRoaXMuJGdldCA9IFNlY3Rpb25NYW5hZ2VyU2VydmljZTtcclxuXHJcblx0Ly8gQG5nSW5qZWN0XHJcblx0ZnVuY3Rpb24gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlKCRyb290U2NvcGUsICRzdGF0ZSkge1xyXG5cclxuXHQgICAgdmFyIF9zZWN0aW9ucyA9IFtdO1xyXG5cclxuXHRcdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0XHRnZXRTZWN0aW9uczogZ2V0U2VjdGlvbnMsXHJcblx0XHRcdHJlZ2lzdGVyOiByZWdpc3RlclNlY3Rpb25zLFxyXG4gICAgICAgICAgICBnZXRNb2R1bGVzOiBnZXRNb2R1bGVzXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbnMoc2VjdGlvbnMpIHtcclxuXHRcdFx0c2VjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcclxuXHJcblx0XHRcdFx0aWYoc3RhdGUucGFyZW50ID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHRzdGF0ZS5wYXJlbnQgPSAnYXBwLXJvb3QnO1xyXG5cclxuXHRcdFx0XHRzdGF0ZS5yZXNvbHZlID1cclxuXHRcdFx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHN0YXRlLnJlc29sdmUgfHwge30sIGNvbmZpZy5yZXNvbHZlQWx3YXlzKTtcclxuXHRcdFx0XHQkc3RhdGVQcm92aWRlci5zdGF0ZShzdGF0ZSk7XHJcblx0XHRcdFx0X3NlY3Rpb25zLnB1c2goc3RhdGUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRNb2R1bGVzKCkge1xyXG5cdFx0ICAgIHJldHVybiAkc3RhdGUuZ2V0KCkuZmlsdGVyKGZ1bmN0aW9uICh4KSB7XHJcblx0XHQgICAgICAgIHJldHVybiB4LnNldHRpbmdzICYmIHguc2V0dGluZ3MubW9kdWxlO1xyXG5cdFx0ICAgIH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNlY3Rpb25zKCkge1xyXG5cdFx0ICAgIC8vcmV0dXJuICRzdGF0ZS5nZXQoKTtcclxuXHRcdCAgICByZXR1cm4gX3NlY3Rpb25zO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycsIFtdKTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJylcclxuICAgIC5zZXJ2aWNlKCdsb2dnZXInLCBsb2dnZXJTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBsb2dnZXJTZXJ2aWNlKCRsb2cpIHtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBpbmZvOiBpbmZvLFxyXG4gICAgICAgIHdhcm5pbmc6IHdhcm5pbmcsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgIGxvZzogJGxvZ1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gaW5mbyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdJbmZvOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2FybmluZyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdXQVJOSU5HOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuZXJyb3IoJ0VSUk9SOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicsXHJcbiAgICBbXHJcbiAgICAgICAgJ2FwcC5sYXlvdXQnLFxyXG4gICAgICAgICdhcHAubG9nZ2luZycsXHJcbiAgICAgICAgJ2FwcC5zZWN0aW9ucycsXHJcbiAgICAgICAgJ2FwcC5zZWN1cml0eScsXHJcbiAgICAgICAgJ2FwcC5kYXRhJyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscycsXHJcbiAgICAgICAgJ2FwcC5kYXNoYm9hcmQnLFxyXG4gICAgICAgICdhcHAuc3RvcmVzJyxcclxuICAgICAgICAnYXBwLnRhc2tzJyxcclxuICAgICAgICAnYXBwLmVtcGxveWVlcycsXHJcbiAgICAgICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAgICAgJ25nQW5pbWF0ZSdcclxuICAgIF0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uY29uZmlnKGNvbmZpZyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlnKGh0dHBDbGllbnRQcm92aWRlciwgJGh0dHBQcm92aWRlcil7XHJcblx0aHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5jYWNoZSA9IHRydWU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcblx0LmRpcmVjdGl2ZSgndWlTdGF0ZScsIHVpU3RhdGUpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHVpU3RhdGUoJHN0YXRlKSB7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0EnLFxyXG5cdFx0bGluazogbGluayxcclxuXHRcdHJlcXVpcmU6ICc/XnVpU3JlZkFjdGl2ZSdcclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3V0aWwnLCBVdGlsU2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBVdGlsU2VydmljZShldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRhZGRQcm9wZXJ0eTogYWRkUHJvcGVydHlcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gYWRkUHJvcGVydHkob2JqLCBuYW1lLCBnZXR0ZXIsIHNldHRlcikge1xyXG5cclxuXHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XHJcblx0XHRcdGdldDogZ2V0dGVyIHx8IGNyZWF0ZUdldHRlcihvYmosIG5hbWUpLFxyXG5cdFx0XHRzZXQ6IHNldHRlciB8fCBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIG9ialtmaWVsZF07XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHJcblx0XHRcdFx0dmFyIG9sZFZhbHVlID0gb2JqW2ZpZWxkXTtcclxuXHJcblx0XHRcdFx0b2JqW2ZpZWxkXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGV2ZW50U2VydmljZS5yYWlzZShuYW1lICsgJ0NoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRvYmo6IG9iaixcclxuXHRcdFx0XHRcdHZhbHVlOiB2YWx1ZSxcclxuXHRcdFx0XHRcdG9yaWdpbmFsVmFsdWU6IG9sZFZhbHVlXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJylcclxuXHQuZmFjdG9yeSgnc3RvcmVTZXJ2aWNlJywgU3RvcmVTZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlLCAkcSkge1xyXG5cclxuXHR2YXIgX2N1cnJlbnRTdG9yZTtcclxuXHR2YXIgX2N1cnJlbnRPcmc7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0Z2V0T3JnczogZ2V0T3JncyxcclxuXHRcdGdldFN0b3JlczogZ2V0U3RvcmVzLFxyXG5cdH07XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudE9yZycsIHtcclxuXHRcdGVudW1lcmFibGU6IHRydWUsXHJcblx0XHRnZXQ6IGdldF9jdXJyZW50T3JnLFxyXG5cdFx0c2V0OiBzZXRfY3VycmVudE9yZ1xyXG5cdH0pO1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnRTdG9yZScsIHtcclxuXHRcdGdldDogZ2V0X2N1cnJlbnRTdG9yZSxcclxuXHRcdHNldDogc2V0X2N1cnJlbnRTdG9yZVxyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0T3JncygpIHtcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL29yZ2FuaXphdGlvbnMnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0U3RvcmVzKG9yZykge1xyXG5cclxuXHRcdGlmKCFvcmcgfHwgIW9yZy5faWQpXHJcblx0XHRcdHJldHVybiAkcS53aGVuKFtdKTtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9vcmdhbml6YXRpb25zLycgKyBvcmcuX2lkICsgJy9zdG9yZXMnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0X2N1cnJlbnRPcmcoKSB7XHJcblx0XHRyZXR1cm4gX2N1cnJlbnRPcmc7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRfY3VycmVudE9yZyh2YWx1ZSkge1xyXG5cclxuXHRcdGlmIChfY3VycmVudE9yZyA9PT0gdmFsdWUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRfY3VycmVudE9yZyA9IHZhbHVlO1xyXG5cdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKCdvcmdDaGFuZ2VkJywgX2N1cnJlbnRPcmcpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0X2N1cnJlbnRTdG9yZSgpIHtcclxuXHRcdHJldHVybiBfY3VycmVudFN0b3JlO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0X2N1cnJlbnRTdG9yZSh2YWx1ZSkge1xyXG5cclxuXHRcdGlmIChfY3VycmVudFN0b3JlID09PSB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdF9jdXJyZW50U3RvcmUgPSB2YWx1ZTtcclxuXHRcdGV2ZW50U2VydmljZS5yYWlzZSgnc3RvcmVDaGFuZ2VkJywgX2N1cnJlbnRTdG9yZSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycsIFsnYXBwLmRhdGEnXSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnKVxyXG5cdC5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcblx0c2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ3Rhc2tzJyxcclxuXHRcdHVybDogJy90YXNrcycsXHJcblx0XHRjb250cm9sbGVyOiAnVGFza0xpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Rhc2tzL3Rhc2tsaXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogMyxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCdnbHlwaGljb24tdGFncyddXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQuY29udHJvbGxlcignVGFza0xpc3RDb250cm9sbGVyJywgVGFza0xpc3RDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBUYXNrTGlzdENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBodHRwQ2xpZW50LCBldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0dGFza3M6IG51bGxcclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdHJlZnJlc2hUYXNrcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hUYXNrcyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoVGFza3Moc3RvcmUpIHtcclxuXHJcblx0XHRpZiAoIXN0b3JlKSB7XHJcblx0XHRcdHZtLnRhc2tzID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0udGFza3MgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnLCBbJ3VpLnJvdXRlciddKVxyXG4ucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdzdG9yZXMnLFxyXG4gICAgICAgICAgICB1cmw6ICcvc3RvcmVzJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0b3Jlc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3N0b3Jlcy9zdG9yZXMuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMixcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1tYXAtbWFya2VyJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycpXHJcbi5jb250cm9sbGVyKCdTdG9yZXNDb250cm9sbGVyJywgU3RvcmVzQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBTdG9yZXNDb250cm9sbGVyKGh0dHBDbGllbnQpe1xyXG5cdFxyXG5cdHZhciB2bSA9IHRoaXM7XHJcblxyXG5cdHZtLnN0b3JlcyA9IFtdO1xyXG5cdHZtLnNlbGVjdGVkID0gbnVsbDtcclxuXHR2bS50YXNrcyA9IFtdO1xyXG5cclxuXHR2bS5zZWxlY3QgPSBmdW5jdGlvbihzdG9yZSl7XHJcblx0XHR2bS5zZWxlY3RlZCA9IHN0b3JlO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5faWQgKyAnL3Rhc2tzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS50YXNrcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS5zdG9yZXMgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcsIFsndWkuYm9vdHN0cmFwJywgJ3VpLnJvdXRlciddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKFtcclxuXHJcbiAgICBdKTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbi5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBMb2dpbkNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvZ2luQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsICRzdGF0ZSl7XHJcblx0XHJcblx0dmFyIHZtID10aGlzO1xyXG5cdHZtLmxvZ2luID0ge1xyXG5cdFx0dXNlcm5hbWU6IFwiXCIsXHJcblx0XHRwYXNzd29yZDogXCJcIixcclxuXHRcdHJlbWVtYmVyTWU6IGZhbHNlXHJcblx0fTtcclxuXHJcblx0dGhpcy5idXN5ID0gZmFsc2U7XHJcblx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmJ1c3kgPSB0cnVlO1xyXG5cdFx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UubG9naW4odm0ubG9naW4udXNlcm5hbWUsIHZtLmxvZ2luLnBhc3N3b3JkLCB2bS5sb2dpbi5yZW1lbWJlck1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXQpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdFx0dm0ubWVzc2FnZSA9IChleC5kYXRhICYmIGV4LmRhdGEubWVzc2FnZSkgfHwgXCJVbmFibGUgdG8gbG9nIGluXCI7XHJcblxyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dm0uYnVzeSA9IGZhbHNlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0fTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycsIFsnYXBwLmRhdGEnXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRSb3V0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJvdXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2VtcGxveWVlcycsXHJcblx0XHR1cmw6ICcvZW1wbG95ZWVzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFbXBsb3llZXNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiA0LFxyXG5cdFx0XHRpY29uOiBbJ2ZhJywgJ2ZhLXVzZXJzJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJylcclxuXHQuY29udHJvbGxlcignRW1wbG95ZWVzQ29udHJvbGxlcicsIEVtcGxveWVlc0NvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEVtcGxveWVlc0NvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIGh0dHBDbGllbnQpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZW1wbG95ZWVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0Ly8gcmVmcmVzaEVtcGxveWVlcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hFbXBsb3llZXMoc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaEVtcGxveWVlcyhzdG9yZSkge1xyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS5lbXBsb3llZXMgPSBbXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvZW1wbG95ZWVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uZW1wbG95ZWVzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcsIFsnYXBwLnNlY3Rpb25zJ10pXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcbi8vLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG4vLyAgICAgICAgdXJsOiAnJyxcclxuLy8gICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4vLyAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+J1xyXG4vLyAgICB9KTtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbi8vICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcicsXHJcbi8vICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbi8vICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnXHJcbi8vICAgIH0pO1xyXG5cclxuLy99KTtcclxuXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnZGFzaGJvYXJkJyxcclxuICAgICAgICAgICAgdXJsOiAnLycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDEsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tc3RhdHMnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0FzaWRlQ29udHJvbGxlcicsIEFzaWRlQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQXNpZGVDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNlY3Rpb25zOiBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKClcclxuXHR9KTtcclxuXHJcblx0Ly92bS5zZWN0aW9ucyA9IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5jb250cm9sbGVyKCdTaGVsbENvbnRyb2xsZXInLCBTaGVsbENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFNoZWxsQ29udHJvbGxlcihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIC8vdmFyIHZtID0gdGhpcztcclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29uZmlnKGluaXRpYWxpemVTdGF0ZXMpXHJcblx0LnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgc2VjdXJpdHlTZXJ2aWNlLCAkdGltZW91dCkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHRpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdXNlciA9IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpO1xyXG5cdFx0aWYgKHVzZXIpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1KSB7XHJcblxyXG5cdFx0XHRcdHZhciB0YXJnZXRTdGF0ZSA9IHUgPyB0b1N0YXRlIDogJ2xvZ2luJztcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKHRhcmdldFN0YXRlKTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgd2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcblx0XHRcclxuXHRcdGlmKCEkcm9vdFNjb3BlLnNob3dTcGxhc2gpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR3YWl0aW5nRm9yVmlldyA9IHRydWU7XHJcblx0fSk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbihlKSB7XHJcblxyXG5cclxuXHRcdGlmICh3YWl0aW5nRm9yVmlldyAmJiAkcm9vdFNjb3BlLnNob3dTcGxhc2gpIHtcclxuXHRcdFx0d2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdnaXZlIHRpbWUgdG8gcmVuZGVyJyk7XHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzaG93U3BsYXNoID0gZmFsc2UnKTtcclxuXHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHRcdFx0fSwgMTApO1xyXG5cclxuXHRcdH1cclxuXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdFx0dXJsOiAnJyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PicsXHJcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5zaG93U3BsYXNoID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly8gQG5nSW5qZWN0XHJcblx0XHRcdFx0dXNlcjogZnVuY3Rpb24oc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogLyogQG5nSW5qZWN0ICovIGZ1bmN0aW9uKCRzdGF0ZSwgdXNlcikge1xyXG5cdFx0XHRcdC8vIGlmKHVzZXIpXHJcblx0XHRcdFx0Ly8gICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0XHQvLyB1cmw6ICcnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiBcInZtXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xvZ2luL2xvZ2luLmh0bWwnXHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuXHRcdFx0Ly91cmw6ICcnLFxyXG5cdFx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvL3VzZXI6IGZ1bmN0aW9uKClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb250cm9sbGVyKCdIZWFkZXJDb250cm9sbGVyJywgSGVhZGVyQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsIHN0b3JlU2VydmljZSwgZXZlbnRTZXJ2aWNlLCB1dGlsKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdG1lc3NhZ2U6IFwiSGVsbG8gSGVhZGVyXCIsXHJcblx0XHR1c2VyOiBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIsXHJcblx0XHRvcmdzOiBbXSxcclxuXHRcdHN0b3JlczogW11cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnb3JnJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudE9yZzt9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSl7c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwgJ3N0b3JlJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlID0gdmFsdWU7fVxyXG5cdH0pO1xyXG5cclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdvcmcnKTtcclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdzdG9yZScpO1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRcdHZtLnVzZXIgPSB4O1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2Uub24oJ3VzZXJDaGFuZ2VkJywgaGFuZGxlVXNlckNoYW5nZWQpO1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRPcmdzKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKG9yZ3Mpe1xyXG5cdFx0XHR2bS5vcmdzID0gb3JncztcclxuXHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2bS5vcmdzWzBdO1xyXG5cdFx0XHRyZWZyZXNoU3RvcmVzKHZtLm9yZ3NbMF0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZXZlbnRTZXJ2aWNlLm9uKCdvcmdDaGFuZ2VkJywgZnVuY3Rpb24oZSwgb3JnKXtcclxuXHRcdFx0Ly92bS5vcmcgPSBvcmc7XHJcblx0XHRcdHJlZnJlc2hTdG9yZXMob3JnKTtcclxuXHRcdFx0XHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoU3RvcmVzKG9yZyl7XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldFN0b3JlcyhvcmcpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3Jlcyl7XHJcblx0XHRcdFx0dm0uc3RvcmVzID0gc3RvcmVzO1xyXG5cdFx0XHRcdHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgPSB2bS5zdG9yZXNbMF07XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlVXNlckNoYW5nZWQodXNlcikge1xyXG5cdFx0dm0udXNlciA9IHVzZXI7XHJcblx0fVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9