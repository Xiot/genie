(function () {
    'use strict';
    angular.module('app.socket', ['btford.socket-io']);
}());
(function () {
    'use strict';
    angular.module('app.socket').factory('socketBuilder', ["socketFactory", "env", function (socketFactory, env) {
        var builder = function (namespace) {
            namespace = namespace || '';
            var myIoSocket = io.connect(env.apiRoot + namespace);
            var mySocket = socketFactory({ ioSocket: myIoSocket });
            return mySocket;
        };
        return builder;
    }]).factory('socket', ["socketBuilder", function (socketBuilder) {
        return socketBuilder();
    }]);
}());
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
    angular.module('solomon', [
        'app.config',
        'app.layout',
        'app.logging',
        'app.sections',
        'app.security',
        'app.data',
        'app.socket',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'app.tasks',
        'app.chat',
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
            httpClient.get('/stores/' + store.id + '/tasks').then(function (x) {
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
}());
(function () {
    'use strict';
    angular.module('app.chat', ['app.socket']);
}());
(function () {
    'use strict';
    angular.module('app.chat').factory('chatService', ChatFactory);
    /* @ngInject */
    function ChatFactory($rootScope, httpClient, socket) {
        var service = {
            sendMessage: sendMessage,
            join: join,
            leave: leave
        };
        init();
        return service;
        function sendMessage(id, message) {
            var url = '/chat/' + id + '/messages';
            return httpClient.post(url, { message: message }, {});
        }
        function join(id) {
            socket.emit('join', { id: id });
        }
        function leave(id) {
            socket.emit('leave', { id: id });
        }
        function init() {
            socket.on('message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
        }
    }
    ChatFactory.$inject = ["$rootScope", "httpClient", "socket"];
}());
(function () {
    'use strict';
    angular.module('app.chat').run(configureRoutes);
    /* @ngInject */
    function configureRoutes(sectionManager) {
        sectionManager.register(getStates());
    }
    configureRoutes.$inject = ["sectionManager"];
    function getStates() {
        return [{
                name: 'chat-list',
                url: '/chats',
                controller: 'ChatListController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/chat/chat-list.html',
                settings: {
                    module: true,
                    order: 4,
                    icon: [
                        'glyphicon',
                        'glyphicon-cloud'
                    ]
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.chat').controller('ChatListController', ChatListController);
    /* @ngInject */
    function ChatListController(storeService, httpClient, eventService, chatService, $rootScope) {
        var vm = angular.extend(this, {
            chats: null,
            sendMessage: sendMessage,
            join: join,
            leave: leave
        });
        eventService.on('storeChanged', onStoreChanged);
        $rootScope.$on('chat-message', function (e, msg) {
            var chat = getChat(msg.chat);
            chat.messages.push({
                message: msg.message,
                time: msg.date,
                user: msg.from
            });
        });
        function onStoreChanged(e, store) {
            refreshChats(store);
        }
        function refreshChats(store) {
            if (!store)
                return vm.tasks = [];
            return httpClient.get('/stores/' + store.id + '/chat').then(function (res) {
                return vm.chats = res.data;
            });
        }
        function join(chat) {
            chatService.join(chat._id);
        }
        function leave(chat) {
            chatService.leave(chat._id);
        }
        function sendMessage(chat, message) {
            return chatService.sendMessage(chat._id, message).then(function () {
            }).catch(function (ex) {
                console.log(ex);
            }).finally(function () {
                chat.currentMessage = '';
            });
        }
        function getChat(id) {
            for (var i = 0; i < vm.chats.length; i++) {
                if (vm.chats[i]._id == id)
                    return vm.chats[i];
            }
            return null;
        }
    }
    ChatListController.$inject = ["storeService", "httpClient", "eventService", "chatService", "$rootScope"];
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
(function () {
    'use strict';
}());
(function () {
    'use strict';
    angular.module('app.config', []);
}());
(function () {
    'use strict';
    angular.module('app.config').constant('env', { apiRoot: 'http://localhost:3000' });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwiY29tbW9uL2RhdGEvZGF0YS5tb2R1bGUuanMiLCJjb21tb24vZGF0YS91dGlsLmpzIiwiY29tbW9uL2RhdGEvc3RvcmVTZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5tb2R1bGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5yb3V0ZXMuanMiLCJhcmVhcy90YXNrcy90YXNrbGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMubW9kdWxlLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5yb3V0ZXMuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9jaGF0L3NvY2tldEJ1aWxkZXIuanMiLCJhcmVhcy9jaGF0L2NoYXQubW9kdWxlLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L2NoYXQucm91dGVzLmpzIiwiYXJlYXMvY2hhdC9jaGF0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImFyZWFzL2FzaWRlL2FzaWRlLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwibGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIiwiY29uZmlnL2NvbmZpZy5tb2R1bGUuanMiLCJlbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsInNvY2tldEZhY3RvcnkiLCJlbnYiLCJidWlsZGVyIiwibmFtZXNwYWNlIiwibXlJb1NvY2tldCIsImlvIiwiY29ubmVjdCIsImFwaVJvb3QiLCJteVNvY2tldCIsImlvU29ja2V0Iiwic29ja2V0QnVpbGRlciIsInNlY3VyaXR5U2VydmljZSIsInN0b3JhZ2VTZXJ2aWNlIiwiJHN0YXRlIiwiaHR0cENsaWVudCIsIiRxIiwiX2N1cnJlbnRVc2VyIiwiX2xpc3RlbmVycyIsInNlcnZpY2UiLCJjdXJyZW50VXNlciIsInJlcXVlc3RDdXJyZW50VXNlciIsIl9yZXF1ZXN0Q3VycmVudFVzZXIiLCJvbiIsImFkZExpc3RlbmVyIiwibG9naW4iLCJfbG9naW4iLCJsb2dvdXQiLCJfbG9nb3V0IiwiZXZlbnROYW1lIiwibGlzdGVuZXIiLCJwdXNoIiwiZmlyZUV2ZW50IiwiYXJncyIsImhhbmRsZXIiLCJldmVudEFyZ3MiLCJzcGxpY2UiLCJjYWxsIiwiZm9yRWFjaCIsImNiIiwidG9rZW4iLCJ3aGVuIiwib3B0aW9ucyIsImNhY2hlIiwiYXV0aCIsImRlZmVyIiwiZ2V0IiwidGhlbiIsInJlc3BvbnNlIiwiZGF0YSIsInJlc29sdmUiLCJjYXRjaCIsInJlcyIsInN0YXR1cyIsInJlamVjdCIsInByb21pc2UiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwicGVyc2lzdCIsInRleHQiLCJidG9hIiwicG9zdCIsImF1dGhfdG9rZW4iLCJ1c2VyIiwic2V0IiwicmVtb3ZlIiwiZ28iLCJfc2V0VXNlciIsInJ1biIsImRlYnVnUm91dGVzIiwiJHJvb3RTY29wZSIsIiRzdGF0ZVBhcmFtcyIsIiRvbiIsImV2ZW50IiwidG9TdGF0ZSIsInRvUGFyYW1zIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImNvbnNvbGUiLCJsb2ciLCJhcmd1bWVudHMiLCJ1bmZvdW5kU3RhdGUiLCJ0byIsInByb3ZpZGVyIiwic2VjdGlvbk1hbmFnZXJQcm92aWRlciIsIiRzdGF0ZVByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJjb25maWciLCJyZXNvbHZlQWx3YXlzIiwiY29uZmlndXJlIiwib3B0cyIsImV4dGVuZCIsImh0bWw1TW9kZSIsIiRnZXQiLCJTZWN0aW9uTWFuYWdlclNlcnZpY2UiLCJfc2VjdGlvbnMiLCJnZXRTZWN0aW9ucyIsInJlZ2lzdGVyIiwicmVnaXN0ZXJTZWN0aW9ucyIsImdldE1vZHVsZXMiLCJzZWN0aW9ucyIsInN0YXRlIiwicGFyZW50IiwidW5kZWZpbmVkIiwiZmlsdGVyIiwieCIsInNldHRpbmdzIiwibG9nZ2VyU2VydmljZSIsIiRsb2ciLCJpbmZvIiwid2FybmluZyIsImVycm9yIiwibWVzc2FnZSIsIlV0aWxTZXJ2aWNlIiwiZXZlbnRTZXJ2aWNlIiwiYWRkUHJvcGVydHkiLCJvYmoiLCJuYW1lIiwiZ2V0dGVyIiwic2V0dGVyIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJjcmVhdGVHZXR0ZXIiLCJjcmVhdGVTZXR0ZXIiLCJmaWVsZCIsInZhbHVlIiwib2xkVmFsdWUiLCJyYWlzZSIsIm9yaWdpbmFsVmFsdWUiLCJTdG9yZVNlcnZpY2UiLCJfY3VycmVudFN0b3JlIiwiX2N1cnJlbnRPcmciLCJnZXRPcmdzIiwiZ2V0U3RvcmVzIiwiZW51bWVyYWJsZSIsImdldF9jdXJyZW50T3JnIiwic2V0X2N1cnJlbnRPcmciLCJnZXRfY3VycmVudFN0b3JlIiwic2V0X2N1cnJlbnRTdG9yZSIsIm9yZyIsIl9pZCIsImh0dHBDbGllbnRQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCJiYXNlVXJpIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwid2l0aENyZWRlbnRpYWxzIiwiZGlyZWN0aXZlIiwidWlTdGF0ZSIsInJlc3RyaWN0IiwibGluayIsInJlcXVpcmUiLCJzY29wZSIsImVsZW1lbnQiLCJhdHRycyIsInVpU3JlZkFjdGl2ZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiYXBwUnVuIiwic2VjdGlvbk1hbmFnZXIiLCJnZXRTdGF0ZXMiLCJjb250cm9sbGVyIiwiY29udHJvbGxlckFzIiwidGVtcGxhdGVVcmwiLCJvcmRlciIsImljb24iLCJUYXNrTGlzdENvbnRyb2xsZXIiLCJzdG9yZVNlcnZpY2UiLCJ2bSIsInRhc2tzIiwib25TdG9yZUNoYW5nZWQiLCJyZWZyZXNoVGFza3MiLCJjdXJyZW50U3RvcmUiLCJlIiwic3RvcmUiLCJpZCIsIlN0b3Jlc0NvbnRyb2xsZXIiLCJzdG9yZXMiLCJzZWxlY3RlZCIsInNlbGVjdCIsImluaXQiLCJMb2dpbkNvbnRyb2xsZXIiLCJyZW1lbWJlck1lIiwiYnVzeSIsInJldCIsImV4IiwiZmluYWxseSIsImNvbmZpZ3VyZVJvdXRlcyIsImdldFJvdXRlcyIsIkVtcGxveWVlc0NvbnRyb2xsZXIiLCJlbXBsb3llZXMiLCJyZWZyZXNoRW1wbG95ZWVzIiwiQ2hhdEZhY3RvcnkiLCJzb2NrZXQiLCJzZW5kTWVzc2FnZSIsImpvaW4iLCJsZWF2ZSIsImVtaXQiLCIkZW1pdCIsIkNoYXRMaXN0Q29udHJvbGxlciIsImNoYXRTZXJ2aWNlIiwiY2hhdHMiLCJtc2ciLCJjaGF0IiwiZ2V0Q2hhdCIsIm1lc3NhZ2VzIiwidGltZSIsImRhdGUiLCJmcm9tIiwicmVmcmVzaENoYXRzIiwiY3VycmVudE1lc3NhZ2UiLCJpIiwibGVuZ3RoIiwiRGFzaGJvYXJkQ29udHJvbGxlciIsIkFzaWRlQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsImluaXRpYWxpemVTdGF0ZXMiLCJlbnN1cmVBdXRoZW50aWNhdGVkIiwiJHRpbWVvdXQiLCJzaG93U3BsYXNoIiwicHJldmVudERlZmF1bHQiLCJ1IiwidGFyZ2V0U3RhdGUiLCJ3YWl0aW5nRm9yVmlldyIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIm90aGVyd2lzZSIsImFic3RyYWN0IiwidGVtcGxhdGUiLCIkc2NvcGUiLCJvbkVudGVyIiwiSGVhZGVyQ29udHJvbGxlciIsInV0aWwiLCJvcmdzIiwiY3VycmVudE9yZyIsImhhbmRsZVVzZXJDaGFuZ2VkIiwicmVmcmVzaFN0b3JlcyIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQURKQSxRQUFRQyxPQUFPLGNBQWEsQ0FBQztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDVkMsUUFBUSwwQ0FBaUIsVUFBVUMsZUFBZUMsS0FBSztRQUVwRCxJQUFJQyxVQUFVLFVBQVVDLFdBQVc7WUFFL0JBLFlBQVlBLGFBQWE7WUFFekIsSUFBSUMsYUFBYUMsR0FBR0MsUUFBUUwsSUFBSU0sVUFBVUo7WUFFMUMsSUFBSUssV0FBV1IsY0FBYyxFQUN6QlMsVUFBVUw7WUFHZCxPQUFPSTs7UUFHWCxPQUFPTjtRQUlWSCxRQUFRLDRCQUFVLFVBQVNXLGVBQWM7UUFDdEMsT0FBT0E7O0tBUlY7QUNiTCxDQUFDLFlBQVk7SUFDVDtJQURKYixRQUFRQyxPQUFPLGdCQUFnQixJQUMxQkMsUUFBUSxtQkFBbUJZOztJQUdoQyxTQUFTQSxnQkFBZ0JDLGdCQUFnQkMsUUFBUUMsWUFBWUMsSUFBSTtRQUU3RCxJQUFJQyxlQUFlO1FBQ25CLElBQUlDLGFBQWE7UUFFakIsSUFBSUMsVUFBVTtZQUNWQyxhQUFhLFlBQVU7Z0JBQUMsT0FBT0g7O1lBQy9CSSxvQkFBb0JDO1lBRXBCQyxJQUFJQztZQUVKQyxPQUFPQztZQUNQQyxRQUFRQzs7UUFHWixPQUFPVDtRQUVQLFNBQVNLLFlBQVlLLFdBQVdDLFVBQVM7WUFDckMsSUFBRyxDQUFDWixXQUFXVztnQkFDWFgsV0FBV1csYUFBYTtZQUM1QlgsV0FBV1csV0FBV0UsS0FBS0Q7O1FBRS9CLFNBQVNFLFVBQVVILFdBQVdJLE1BQUs7WUFDL0IsSUFBSUMsVUFBVWhCLFdBQVdXO1lBQ3pCLElBQUcsQ0FBQ0s7Z0JBQ0E7WUFFSixJQUFJQyxZQUFZLEdBQUdDLE9BQU9DLEtBQUtKLE1BQU07WUFDckNDLFFBQVFJLFFBQVEsVUFBU0MsSUFBRztnQkFDeEJBLEdBQUdKOzs7UUFJWCxTQUFTYixvQkFBb0JrQixPQUFPO1lBRWhDLElBQUl2QjtnQkFDQSxPQUFPRCxHQUFHeUIsS0FBS3hCO1lBR25CLElBQUl5QixVQUFVLEVBQ1ZDLE9BQU87WUFFWCxJQUFJSDtnQkFDQUUsUUFBUUUsT0FBTyxFQUNYLFVBQVVKO1lBR2xCLElBQUlLLFFBQVE3QixHQUFHNkI7WUFFZjlCLFdBQVcrQixJQUFJLG1CQUFtQkosU0FDN0JLLEtBQUssVUFBU0MsVUFBVTtnQkFFckIvQixlQUFlK0IsU0FBU0M7Z0JBRXhCSixNQUFNSyxRQUFRRixTQUFTQztnQkFDdkIsT0FBT0QsU0FBU0M7ZUFFakJFLE1BQU0sVUFBU0MsS0FBSztnQkFDbkIsSUFBSUEsSUFBSUMsV0FBVztvQkFDZixPQUFPUixNQUFNSyxRQUFRO2dCQUN6QkwsTUFBTVMsT0FBT0Y7O1lBR3JCLE9BQU9QLE1BQU1VOztRQUdqQixTQUFTN0IsT0FBTzhCLFVBQVVDLFVBQVVDLFNBQVM7WUFFekMsSUFBSUMsT0FBT0MsS0FBS0osV0FBVyxNQUFNQztZQUNqQyxJQUFJakIsUUFBUTtZQUVaLE9BQU96QixXQUFXOEMsS0FBSyxXQUFXLE1BQU0sRUFDaENqQixNQUFNLEVBQ0YsU0FBU2UsVUFHaEJaLEtBQUssVUFBU0ssS0FBSztnQkFDaEJaLFFBQVFZLElBQUlILEtBQUthO2dCQUVqQixPQUFPeEMsb0JBQW9Ca0I7ZUFDNUJPLEtBQUssVUFBU2dCLE1BQU07Z0JBQ25CbEQsZUFBZW1ELElBQUksY0FBY3hCLE9BQU87Z0JBQ3hDLE9BQU91Qjs7O1FBSW5CLFNBQVNuQyxVQUFVO1lBQ2ZmLGVBQWVvRCxPQUFPO1lBQ3RCbkQsT0FBT29ELEdBQUc7O1FBR2QsU0FBU0MsU0FBU0osTUFBSztZQUNuQjlDLGVBQWU4QztZQUNmL0IsVUFBVSxlQUFlK0I7Ozs7S0E1QjVCO0FDckVMLENBQUMsWUFBWTtJQUNUO0lBQUpqRSxRQUFRQyxPQUFPLGdCQUFnQixDQUFDO0lBR2hDRCxRQUFRQyxPQUFPLGdCQUFnQnFFLElBQUlDOztJQUduQyxTQUFTQSxZQUFZQyxZQUFZeEQsUUFBUXlELGNBQWM7Ozs7UUFNbkRELFdBQVd4RCxTQUFTQTtRQUNwQndELFdBQVdDLGVBQWVBO1FBRTFCRCxXQUFXRSxJQUFJLHFCQUFxQixVQUFVQyxPQUFPQyxTQUFTQyxVQUFVQyxXQUFXQyxZQUFZO1lBQzNGQyxRQUFRQyxJQUFJO1lBQ1pELFFBQVFDLElBQUlDOztRQUdoQlYsV0FBV0UsSUFBSSxrQkFBa0IsVUFBVUMsT0FBT1EsY0FBY0wsV0FBV0MsWUFBWTtZQUNuRkMsUUFBUUMsSUFBSSxvQkFBb0JFLGFBQWFDLEtBQUs7WUFDbERKLFFBQVFDLElBQUlFLGNBQWNMLFdBQVdDOzs7Ozs7Ozs7Ozs7S0FLeEM7QUM1QkwsQ0FBQyxZQUFZO0lBQ1Q7SUFBSi9FLFFBQVFDLE9BQU8sZ0JBQ2JvRixTQUFTLGtCQUFrQkM7O0lBRzdCLFNBQVNBLHVCQUF1QkMsZ0JBQWdCQyxtQkFBbUI7UUFFbEUsSUFBSUMsU0FBUyxFQUNaQyxlQUFlO1FBR2hCLEtBQUtDLFlBQVksVUFBVUMsTUFBTTtZQUNoQzVGLFFBQVE2RixPQUFPSixRQUFRRzs7UUFHeEJKLGtCQUFrQk0sVUFBVTtRQUc1QixLQUFLQyxPQUFPQzs7UUFHWixTQUFTQSxzQkFBc0J4QixZQUFZeEQsUUFBUTtZQUUvQyxJQUFJaUYsWUFBWTtZQUVuQixJQUFJNUUsVUFBVTtnQkFDYjZFLGFBQWFBO2dCQUNiQyxVQUFVQztnQkFDREMsWUFBWUE7O1lBR3RCLE9BQU9oRjtZQUVQLFNBQVMrRSxpQkFBaUJFLFVBQVU7Z0JBQ25DQSxTQUFTOUQsUUFBUSxVQUFVK0QsT0FBTztvQkFFakMsSUFBR0EsTUFBTUMsV0FBV0M7d0JBQ25CRixNQUFNQyxTQUFTO29CQUVoQkQsTUFBTW5ELFVBQ0xwRCxRQUFRNkYsT0FBT1UsTUFBTW5ELFdBQVcsSUFBSXFDLE9BQU9DO29CQUM1Q0gsZUFBZWdCLE1BQU1BO29CQUNyQk4sVUFBVWhFLEtBQUtzRTs7O1lBSWpCLFNBQVNGLGFBQWE7Z0JBQ2xCLE9BQU9yRixPQUFPZ0MsTUFBTTBELE9BQU8sVUFBVUMsR0FBRztvQkFDcEMsT0FBT0EsRUFBRUMsWUFBWUQsRUFBRUMsU0FBUzNHOzs7WUFJeEMsU0FBU2lHLGNBQWM7O2dCQUVuQixPQUFPRDs7Ozs7O0tBZFI7QUN4Q0wsQ0FBQyxZQUFZO0lBQ1Q7SUFBSmpHLFFBQVFDLE9BQU8sZUFBZTtLQUV6QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBQUpELFFBQVFDLE9BQU8sZUFDVm9CLFFBQVEsVUFBVXdGOztJQUd2QixTQUFTQSxjQUFjQyxNQUFNO1FBRXpCLElBQUl6RixVQUFVO1lBQ1YwRixNQUFNQTtZQUNOQyxTQUFTQTtZQUNUQyxPQUFPQTtZQUNQaEMsS0FBSzZCOztRQUdULE9BQU96RjtRQUdQLFNBQVMwRixLQUFLRyxTQUFTL0QsTUFBTTtZQUN6QjJELEtBQUtDLEtBQUssV0FBV0csU0FBUy9EOztRQUdsQyxTQUFTNkQsUUFBUUUsU0FBUy9ELE1BQU07WUFDNUIyRCxLQUFLQyxLQUFLLGNBQWNHLFNBQVMvRDs7UUFHckMsU0FBUzhELE1BQU1DLFNBQVMvRCxNQUFNO1lBQzFCMkQsS0FBS0csTUFBTSxZQUFZQyxTQUFTL0Q7Ozs7S0FKbkM7QUN0QkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5ELFFBQVFDLE9BQU8sWUFBWTtLQUd0QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sWUFDYkMsUUFBUSxRQUFRaUg7SUFFbEIsU0FBU0EsWUFBWUMsY0FBYztRQUVsQyxJQUFJL0YsVUFBVSxFQUNiZ0csYUFBYUE7UUFHZCxPQUFPaEc7UUFFUCxTQUFTZ0csWUFBWUMsS0FBS0MsTUFBTUMsUUFBUUMsUUFBUTtZQUcvQ0MsT0FBT0MsZUFBZUwsS0FBS0MsTUFBTTtnQkFDaEN2RSxLQUFLd0UsVUFBVUksYUFBYU4sS0FBS0M7Z0JBQ2pDckQsS0FBS3VELFVBQVVJLGFBQWFQLEtBQUtDOztZQUdsQyxTQUFTSyxhQUFhTixLQUFLQyxNQUFNO2dCQUNoQyxJQUFJTyxRQUFRLE1BQU1QO2dCQUNsQixPQUFPLFlBQVc7b0JBQ2pCLE9BQU9ELElBQUlROzs7WUFJYixTQUFTRCxhQUFhUCxLQUFLQyxNQUFNO2dCQUNoQyxJQUFJTyxRQUFRLE1BQU1QO2dCQUNsQixPQUFPLFVBQVNRLE9BQU87b0JBRXRCLElBQUlDLFdBQVdWLElBQUlRO29CQUVuQlIsSUFBSVEsU0FBU0M7b0JBQ2JYLGFBQWFhLE1BQU1WLE9BQU8sV0FBVzt3QkFDcENELEtBQUtBO3dCQUNMUyxPQUFPQTt3QkFDUEcsZUFBZUY7Ozs7Ozs7S0FMZjtBQy9CTCxDQUFDLFlBQVk7SUFDVDtJQURKaEksUUFBUUMsT0FBTyxZQUNiQyxRQUFRLGdCQUFnQmlJOztJQUcxQixTQUFTQSxhQUFhbEgsWUFBWW1HLGNBQWNsRyxJQUFJO1FBRW5ELElBQUlrSDtRQUNKLElBQUlDO1FBRUosSUFBSWhILFVBQVU7WUFDYmlILFNBQVNBO1lBQ1RDLFdBQVdBOztRQUdaYixPQUFPQyxlQUFldEcsU0FBUyxjQUFjO1lBQzVDbUgsWUFBWTtZQUNaeEYsS0FBS3lGO1lBQ0x2RSxLQUFLd0U7O1FBR05oQixPQUFPQyxlQUFldEcsU0FBUyxnQkFBZ0I7WUFDOUMyQixLQUFLMkY7WUFDTHpFLEtBQUswRTs7UUFHTixPQUFPdkg7UUFFUCxTQUFTaUgsVUFBVTtZQUNsQixPQUFPckgsV0FBVytCLElBQUksa0JBQ3BCQyxLQUFLLFVBQVNLLEtBQUs7Z0JBQ25CLE9BQU9BLElBQUlIOzs7UUFJZCxTQUFTb0YsVUFBVU0sS0FBSztZQUV2QixJQUFHLENBQUNBLE9BQU8sQ0FBQ0EsSUFBSUM7Z0JBQ2YsT0FBTzVILEdBQUd5QixLQUFLO1lBRWhCLE9BQU8xQixXQUFXK0IsSUFBSSxvQkFBb0I2RixJQUFJQyxNQUFNLFdBQ2xEN0YsS0FBSyxVQUFTSyxLQUFLO2dCQUNuQixPQUFPQSxJQUFJSDs7O1FBSWQsU0FBU3NGLGlCQUFpQjtZQUN6QixPQUFPSjs7UUFHUixTQUFTSyxlQUFlWCxPQUFPO1lBRTlCLElBQUlNLGdCQUFnQk47Z0JBQ25CO1lBRURNLGNBQWNOO1lBQ2RYLGFBQWFhLE1BQU0sY0FBY0k7O1FBR2xDLFNBQVNNLG1CQUFtQjtZQUMzQixPQUFPUDs7UUFHUixTQUFTUSxpQkFBaUJiLE9BQU87WUFFaEMsSUFBSUssa0JBQWtCTDtnQkFDckI7WUFFREssZ0JBQWdCTDtZQUNoQlgsYUFBYWEsTUFBTSxnQkFBZ0JHOzs7O0tBaEJoQztBQ3BETCxDQUFDLFlBQVk7SUFDVDtJQURKcEksUUFBUUMsT0FBTyxXQUNYO1FBQ0k7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztJQUdSRCxRQUFRQyxPQUFPLFdBQ2R3RixPQUFPQTs7SUFHUixTQUFTQSxPQUFPc0Qsb0JBQW9CQyxlQUFjO1FBQ2pERCxtQkFBbUJFLFVBQVU7UUFFdEJELGNBQWNFLFNBQVNDLGFBQWE7UUFDeENILGNBQWNFLFNBQVNFLGtCQUFrQjtRQUN6Q0osY0FBY0UsU0FBU3JHLFFBQVE7OztLQUQ5QjtBQzNCTCxDQUFDLFlBQVk7SUFDVDtJQURKN0MsUUFBUUMsT0FBTyxXQUNib0osVUFBVSxXQUFXQzs7SUFHdkIsU0FBU0EsUUFBUXRJLFFBQVE7UUFFeEIsT0FBTztZQUNOdUksVUFBVTtZQUNWQyxNQUFNQTtZQUNOQyxTQUFTOztRQUdWLFNBQVNELEtBQUtFLE9BQU9DLFNBQVNDLE9BQU9DLGNBQWM7WUFFbEQsSUFBSXRDLE9BQU9tQyxNQUFNSSxNQUFNRixNQUFNTjtZQUM3QixJQUFJUyxTQUFTTCxNQUFNSSxNQUFNRixNQUFNSTtZQUUvQixJQUFJQyxNQUFNakosT0FBT2tKLEtBQUszQyxNQUFNd0M7WUFFNUIsSUFBR0UsUUFBUTtnQkFDVkEsTUFBTTtZQUVQTCxNQUFNTyxLQUFLLFFBQVFGOzs7O0tBSGhCO0FDbkJMLENBQUMsWUFBWTtJQUNUO0lBREpqSyxRQUFRQyxPQUFPLGFBQWEsQ0FBQztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sYUFDYnFFLElBQUk4Rjs7SUFHTixTQUFTQSxPQUFPQyxnQkFBZ0I7UUFFL0JBLGVBQWVsRSxTQUFTbUU7OztJQUl6QixTQUFTQSxZQUFZO1FBQ3BCLE9BQU8sQ0FBQztnQkFDUC9DLE1BQU07Z0JBQ04wQyxLQUFLO2dCQUNMTSxZQUFZO2dCQUNaQyxjQUFjO2dCQUNkQyxhQUFhO2dCQUNiN0QsVUFBVTtvQkFDVDNHLFFBQVE7b0JBQ1J5SyxPQUFPO29CQUNQQyxNQUFNO3dCQUFDO3dCQUFZOzs7OztLQUlqQjtBQ3hCTCxDQUFDLFlBQVk7SUFDVDtJQURKM0ssUUFBUUMsT0FBTyxhQUNic0ssV0FBVyxzQkFBc0JLOztJQUduQyxTQUFTQSxtQkFBbUJDLGNBQWM1SixZQUFZbUcsY0FBYztRQUVuRSxJQUFJMEQsS0FBSzlLLFFBQVE2RixPQUFPLE1BQU0sRUFDN0JrRixPQUFPO1FBR1IzRCxhQUFhM0YsR0FBRyxnQkFBZ0J1SjtRQUVoQ0MsYUFBYUosYUFBYUs7UUFFMUIsU0FBU0YsZUFBZUcsR0FBR0MsT0FBTztZQUNqQ0gsYUFBYUc7O1FBR2QsU0FBU0gsYUFBYUcsT0FBTztZQUU1QixJQUFJLENBQUNBLE9BQU87Z0JBQ1hOLEdBQUdDLFFBQVE7Z0JBQ1g7O1lBR0Q5SixXQUFXK0IsSUFBSSxhQUFhb0ksTUFBTUMsS0FBSyxVQUNyQ3BJLEtBQUssVUFBU0ssS0FBSztnQkFDbkJ3SCxHQUFHQyxRQUFRekgsSUFBSUg7Ozs7O0tBTmQ7QUNyQkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5ELFFBQVFDLE9BQU8sY0FBYyxDQUFDLGNBQzdCcUUsSUFBSThGOztJQUdMLFNBQVNBLE9BQU9DLGdCQUFnQjtRQUU1QkEsZUFBZWxFLFNBQVNtRTs7O0lBSTVCLFNBQVNBLFlBQVk7UUFDakIsT0FBTyxDQUNIO2dCQUNJL0MsTUFBTTtnQkFDTjBDLEtBQUs7Z0JBQ0xNLFlBQVk7Z0JBQ1pDLGNBQWM7Z0JBQ2RDLGFBQWE7Z0JBQ2I3RCxVQUFVO29CQUNOM0csUUFBUTtvQkFDUnlLLE9BQU87b0JBQ1BDLE1BQU07d0JBQUM7d0JBQWE7Ozs7O0tBRy9CO0FDeEJMLENBQUMsWUFBWTtJQUNUO0lBREozSyxRQUFRQyxPQUFPLGNBQ2RzSyxXQUFXLG9CQUFvQmU7SUFFaEMsU0FBU0EsaUJBQWlCckssWUFBVztRQUVwQyxJQUFJNkosS0FBSztRQUVUQSxHQUFHUyxTQUFTO1FBQ1pULEdBQUdVLFdBQVc7UUFDZFYsR0FBR0MsUUFBUTtRQUVYRCxHQUFHVyxTQUFTLFVBQVNMLE9BQU07WUFDMUJOLEdBQUdVLFdBQVdKO1lBRWRuSyxXQUFXK0IsSUFBSSxhQUFhb0ksTUFBTUMsS0FBSyxVQUN0Q3BJLEtBQUssVUFBUzBELEdBQUU7Z0JBQ2hCbUUsR0FBR0MsUUFBUXBFLEVBQUV4RDs7O1FBSWZ1STtRQUdBLFNBQVNBLE9BQU07WUFDZHpLLFdBQVcrQixJQUFJLFdBQ2RDLEtBQUssVUFBUzBELEdBQUU7Z0JBQ2hCbUUsR0FBR1MsU0FBUzVFLEVBQUV4RDs7Ozs7S0FMWjtBQ3JCTCxDQUFDLFlBQVk7SUFDVDtJQURKbkQsUUFBUUMsT0FBTyxjQUFjO1FBQUM7UUFBZ0I7O0tBTXpDO0FDTkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxjQUNWcUUsSUFBSThGOztJQUdULFNBQVNBLE9BQU9DLGdCQUFnQjtRQUU1QkEsZUFBZWxFLFNBQVM7OztLQUN2QjtBQ1BMLENBQUMsWUFBWTtJQUNUO0lBREpuRyxRQUFRQyxPQUFPLGNBQ2RzSyxXQUFXLG1CQUFtQm9COztJQUcvQixTQUFTQSxnQkFBZ0I3SyxpQkFBaUJFLFFBQU87UUFFaEQsSUFBSThKLEtBQUk7UUFDUkEsR0FBR25KLFFBQVE7WUFDVitCLFVBQVU7WUFDVkMsVUFBVTtZQUNWaUksWUFBWTs7UUFHYixLQUFLQyxPQUFPO1FBQ1osS0FBSzNFLFVBQVU7UUFFZixLQUFLdkYsUUFBUSxZQUFVO1lBQ3RCLEtBQUtrSyxPQUFPO1lBQ1osS0FBSzNFLFVBQVU7WUFFZnBHLGdCQUFnQmEsTUFBTW1KLEdBQUduSixNQUFNK0IsVUFBVW9ILEdBQUduSixNQUFNZ0MsVUFBVW1ILEdBQUduSixNQUFNaUssWUFDbkUzSSxLQUFLLFVBQVM2SSxLQUFJO2dCQUNsQjlLLE9BQU9vRCxHQUFHO2VBRVJmLE1BQU0sVUFBUzBJLElBQUc7Z0JBQ3BCakIsR0FBRzVELFVBQVc2RSxHQUFHNUksUUFBUTRJLEdBQUc1SSxLQUFLK0QsV0FBWTtlQUUzQzhFLFFBQVEsWUFBVTtnQkFDcEJsQixHQUFHZSxPQUFPOzs7OztLQUhUO0FDekJMLENBQUMsWUFBWTtJQUNUO0lBREo3TCxRQUFRQyxPQUFPLGlCQUFpQixDQUFDO0tBRzVCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxpQkFDZHFFLElBQUkySDs7SUFHTCxTQUFTQSxnQkFBZ0I1QixnQkFBZTtRQUN2Q0EsZUFBZWxFLFNBQVMrRjs7O0lBR3pCLFNBQVNBLFlBQVc7UUFDbkIsT0FBTyxDQUFDO2dCQUNQM0UsTUFBTTtnQkFDTjBDLEtBQUs7Z0JBQ0xNLFlBQVk7Z0JBQ1pDLGNBQWM7Z0JBQ2RDLGFBQWE7Z0JBQ2I3RCxVQUFVO29CQUNUM0csUUFBUTtvQkFDUnlLLE9BQU87b0JBQ1BDLE1BQU07d0JBQUM7d0JBQU07Ozs7O0tBTVg7QUN4QkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESjNLLFFBQVFDLE9BQU8saUJBQ2JzSyxXQUFXLHVCQUF1QjRCOztJQUdwQyxTQUFTQSxvQkFBb0J0QixjQUFjekQsY0FBY25HLFlBQVk7UUFFcEUsSUFBSTZKLEtBQUs5SyxRQUFRNkYsT0FBTyxNQUFNLEVBQzdCdUcsV0FBVztRQUdaaEYsYUFBYTNGLEdBQUcsZ0JBQWdCdUo7O1FBSWhDLFNBQVNBLGVBQWVHLEdBQUdDLE9BQU87WUFDakNpQixpQkFBaUJqQjs7UUFHbEIsU0FBU2lCLGlCQUFpQmpCLE9BQU87WUFDaEMsSUFBSSxDQUFDQSxPQUFPO2dCQUNYTixHQUFHc0IsWUFBWTtnQkFDZjs7WUFHRG5MLFdBQVcrQixJQUFJLGFBQWFvSSxNQUFNQyxLQUFLLGNBQ3JDcEksS0FBSyxVQUFTSyxLQUFLO2dCQUNuQndILEdBQUdzQixZQUFZOUksSUFBSUg7Ozs7O0tBTGxCO0FDckJMLENBQUMsWUFBWTtJQUNUO0tBQ0M7QUNGTCxDQUFDLFlBQVk7SUFDVDtJQURKbkQsUUFBUUMsT0FBTyxZQUFXLENBQUM7S0FHdEI7QUNITCxDQUFDLFlBQVk7SUFDVDtJQURKRCxRQUFRQyxPQUFPLFlBQ2JDLFFBQVEsZUFBZW9NOztJQUd6QixTQUFTQSxZQUFZOUgsWUFBWXZELFlBQVlzTCxRQUFRO1FBRXBELElBQUlsTCxVQUFVO1lBQ2JtTCxhQUFhQTtZQUNiQyxNQUFNQTtZQUNOQyxPQUFPQTs7UUFHUmhCO1FBRUEsT0FBT3JLO1FBRVAsU0FBU21MLFlBQVluQixJQUFJbkUsU0FBUztZQUVqQyxJQUFJK0MsTUFBTSxXQUFXb0IsS0FBSztZQUMxQixPQUFPcEssV0FBVzhDLEtBQUtrRyxLQUFLLEVBQUMvQyxTQUFTQSxXQUFTOztRQUdoRCxTQUFTdUYsS0FBS3BCLElBQUc7WUFDaEJrQixPQUFPSSxLQUFLLFFBQVEsRUFBQ3RCLElBQUlBOztRQUcxQixTQUFTcUIsTUFBTXJCLElBQUc7WUFDakJrQixPQUFPSSxLQUFLLFNBQVMsRUFBQ3RCLElBQUlBOztRQUczQixTQUFTSyxPQUFNO1lBQ2RhLE9BQU85SyxHQUFHLFdBQVcsVUFBUzBCLE1BQUs7Z0JBQ2xDNkIsUUFBUUMsSUFBSTlCO2dCQUNacUIsV0FBV29JLE1BQU0sZ0JBQWdCeko7Ozs7O0tBSi9CO0FDN0JMLENBQUMsWUFBWTtJQUNUO0lBREpuRCxRQUFRQyxPQUFPLFlBQ2RxRSxJQUFJMkg7O0lBR0wsU0FBU0EsZ0JBQWdCNUIsZ0JBQWU7UUFDdkNBLGVBQWVsRSxTQUFTbUU7OztJQUd6QixTQUFTQSxZQUFXO1FBQ25CLE9BQU8sQ0FBQztnQkFDUC9DLE1BQU07Z0JBQ04wQyxLQUFLO2dCQUNMTSxZQUFZO2dCQUNaQyxjQUFjO2dCQUNkQyxhQUFhO2dCQUNiN0QsVUFBVTtvQkFDVDNHLFFBQVE7b0JBQ1J5SyxPQUFPO29CQUNQQyxNQUFNO3dCQUFDO3dCQUFhOzs7OztLQU1sQjtBQ3hCTCxDQUFDLFlBQVk7SUFDVDtJQURKM0ssUUFBUUMsT0FBTyxZQUNic0ssV0FBVyxzQkFBc0JzQzs7SUFHbkMsU0FBU0EsbUJBQW1CaEMsY0FBYzVKLFlBQVltRyxjQUFjMEYsYUFBYXRJLFlBQVk7UUFFNUYsSUFBSXNHLEtBQUs5SyxRQUFRNkYsT0FBTyxNQUFNO1lBQzdCa0gsT0FBTztZQUNQUCxhQUFhQTtZQUNiQyxNQUFNQTtZQUNOQyxPQUFPQTs7UUFHUnRGLGFBQWEzRixHQUFHLGdCQUFnQnVKO1FBRWhDeEcsV0FBV0UsSUFBSSxnQkFBZ0IsVUFBU3lHLEdBQUc2QixLQUFJO1lBRTlDLElBQUlDLE9BQU9DLFFBQVFGLElBQUlDO1lBQ3ZCQSxLQUFLRSxTQUFTbEwsS0FBSztnQkFDbEJpRixTQUFTOEYsSUFBSTlGO2dCQUNia0csTUFBTUosSUFBSUs7Z0JBQ1ZwSixNQUFNK0ksSUFBSU07OztRQUlaLFNBQVN0QyxlQUFlRyxHQUFHQyxPQUFPO1lBQ2pDbUMsYUFBYW5DOztRQUdkLFNBQVNtQyxhQUFhbkMsT0FBTztZQUM1QixJQUFJLENBQUNBO2dCQUNKLE9BQU9OLEdBQUdDLFFBQVE7WUFFbkIsT0FBTzlKLFdBQVcrQixJQUFJLGFBQWFvSSxNQUFNQyxLQUFLLFNBQzVDcEksS0FBSyxVQUFTSyxLQUFLO2dCQUNuQixPQUFPd0gsR0FBR2lDLFFBQVF6SixJQUFJSDs7O1FBSXpCLFNBQVNzSixLQUFLUSxNQUFLO1lBQ2xCSCxZQUFZTCxLQUFLUSxLQUFLbkU7O1FBR3ZCLFNBQVM0RCxNQUFNTyxNQUFLO1lBQ25CSCxZQUFZSixNQUFNTyxLQUFLbkU7O1FBR3hCLFNBQVMwRCxZQUFZUyxNQUFNL0YsU0FBUztZQUNuQyxPQUFPNEYsWUFBWU4sWUFBWVMsS0FBS25FLEtBQUs1QixTQUN2Q2pFLEtBQUssWUFBVztlQUtkSSxNQUFNLFVBQVMwSSxJQUFJO2dCQUNyQi9HLFFBQVFDLElBQUk4RztlQUNWQyxRQUFRLFlBQVU7Z0JBQ3BCaUIsS0FBS08saUJBQWlCOzs7UUFJekIsU0FBU04sUUFBUTdCLElBQUc7WUFDbkIsS0FBSSxJQUFJb0MsSUFBSSxHQUFHQSxJQUFJM0MsR0FBR2lDLE1BQU1XLFFBQVFELEtBQUk7Z0JBQ3ZDLElBQUczQyxHQUFHaUMsTUFBTVUsR0FBRzNFLE9BQU91QztvQkFDckIsT0FBT1AsR0FBR2lDLE1BQU1VOztZQUVsQixPQUFPOzs7O0tBZEo7QUNwREwsQ0FBQyxZQUFZO0lBQ1Q7SUFESnpOLFFBQVFDLE9BQU8saUJBQWlCLENBQUMsaUJBQzVCcUUsSUFBSThGOzs7Ozs7Ozs7Ozs7Ozs7SUFtQlQsU0FBU0EsT0FBT0MsZ0JBQWdCO1FBRTVCQSxlQUFlbEUsU0FBU21FOzs7SUFJNUIsU0FBU0EsWUFBWTtRQUNqQixPQUFPLENBQ0g7Z0JBQ0kvQyxNQUFNO2dCQUNOMEMsS0FBSztnQkFDTE0sWUFBWTtnQkFDWkMsY0FBYztnQkFDZEMsYUFBYTtnQkFDYjdELFVBQVU7b0JBQ04zRyxRQUFRO29CQUNSeUssT0FBTztvQkFDUEMsTUFBTTt3QkFBQzt3QkFBYTs7Ozs7S0FBL0I7QUNyQ0wsQ0FBQyxZQUFZO0lBQ1Q7SUFBSjNLLFFBQVFDLE9BQU8saUJBQ1ZzSyxXQUFXLHVCQUF1Qm9EOztJQUd2QyxTQUFTQSxzQkFBc0I7UUFDM0IsS0FBS3pHLFVBQVU7O0tBQ2Q7QUNQTCxDQUFDLFlBQVk7SUFDVDtJQURKbEgsUUFBUUMsT0FBTyxjQUNic0ssV0FBVyxtQkFBbUJxRDs7SUFHaEMsU0FBU0EsZ0JBQWdCdkQsZ0JBQWdCO1FBRXhDLElBQUlTLEtBQUs5SyxRQUFRNkYsT0FBTyxNQUFNLEVBQzdCUyxVQUFVK0QsZUFBZWhFOzs7S0FBdEI7QUNQTCxDQUFDLFlBQVk7SUFDVDtJQURKckcsUUFBUUMsT0FBTyxjQUNWc0ssV0FBVyxtQkFBbUJzRDs7SUFHbkMsU0FBU0EsZ0JBQWdCeEQsZ0JBQWdCOzs7S0FFcEM7QUNOTCxDQUFDLFlBQVk7SUFDVDtJQURKckssUUFBUUMsT0FBTyxjQUNid0YsT0FBT3FJLGtCQUNQeEosSUFBSXlKOztJQUdOLFNBQVNBLG9CQUFvQnZKLFlBQVl4RCxRQUFRRixpQkFBaUJrTixVQUFVO1FBQzNFeEosV0FBV3lKLGFBQWE7UUFFeEJ6SixXQUFXRSxJQUFJLHFCQUFxQixVQUFTeUcsR0FBR3ZHLFNBQVNDLFVBQVVDLFdBQVdDLFlBQVk7WUFFekYsSUFBSUgsUUFBUTJDLFNBQVMsU0FBUztnQkFDN0I7O1lBR0QsSUFBSXRELE9BQU9uRCxnQkFBZ0JRO1lBQzNCLElBQUkyQyxNQUFNO2dCQUNUOztZQUVEa0gsRUFBRStDO1lBRUZwTixnQkFBZ0JTLHFCQUNkMEIsS0FBSyxVQUFTa0wsR0FBRztnQkFFakIsSUFBSUMsY0FBY0QsSUFBSXZKLFVBQVU7Z0JBRWhDNUQsT0FBT29ELEdBQUdnSztlQUNSL0ssTUFBTSxVQUFTMEksSUFBSTtnQkFDckIvSyxPQUFPb0QsR0FBRzs7O1FBSWIsSUFBSWlLLGlCQUFpQjtRQUNyQjdKLFdBQVdFLElBQUksdUJBQXVCLFVBQVNDLE9BQU9DLFNBQVNDLFVBQVVDLFdBQVdDLFlBQVk7WUFFL0YsSUFBRyxDQUFDUCxXQUFXeUo7Z0JBQ2Q7WUFFREksaUJBQWlCOztRQUdsQjdKLFdBQVdFLElBQUksc0JBQXNCLFVBQVN5RyxHQUFHO1lBR2hELElBQUlrRCxrQkFBa0I3SixXQUFXeUosWUFBWTtnQkFDNUNJLGlCQUFpQjtnQkFFakJySixRQUFRQyxJQUFJO2dCQUNaK0ksU0FBUyxZQUFXO29CQUNuQmhKLFFBQVFDLElBQUk7b0JBQ1pULFdBQVd5SixhQUFhO21CQUN0Qjs7Ozs7O0lBUU4sU0FBU0gsaUJBQWlCdkksZ0JBQWdCK0ksb0JBQW9CO1FBRTdEQSxtQkFBbUJDLFVBQVU7UUFHN0JoSixlQUNFZ0IsTUFBTSxRQUFRO1lBQ2QwRCxLQUFLO1lBQ0x1RSxVQUFVO1lBQ1ZDLFVBQVU7WUFDVmxFLHFDQUFZLFVBQVNtRSxRQUFRbEssWUFBWTtnQkFFeEMsSUFBSUEsV0FBV3lKLGVBQWV4SDtvQkFDN0JqQyxXQUFXeUosYUFBYTs7WUFFMUI3SyxTQUFTOztnQkFFUmEsMEJBQU0sVUFBU25ELGlCQUFpQjtvQkFDL0IsT0FBT0EsZ0JBQWdCUzs7O1lBR3pCb047K0JBQXlCLFVBQVMzTixRQUFRaUQsTUFBTTs7V0FPaERzQyxNQUFNLFNBQVM7O1lBRWZnRSxZQUFZO1lBQ1pDLGNBQWM7WUFDZEMsYUFBYTtXQUVibEUsTUFBTSxZQUFZOztZQUVsQkMsUUFBUTtZQUNSZ0ksVUFBVTtZQUNWakUsWUFBWTtZQUNaRSxhQUFhO1lBQ2JySCxTQUFTO1lBR1R1TCxTQUFTLFlBQVc7Z0JBQ25CM0osUUFBUUMsSUFBSTs7Ozs7S0ExQlg7QUM1RUwsQ0FBQyxZQUFZO0lBQ1Q7SUFESmpGLFFBQVFDLE9BQU8sY0FDYnNLLFdBQVcsb0JBQW9CcUU7O0lBR2pDLFNBQVNBLGlCQUFpQjlOLGlCQUFpQitKLGNBQWN6RCxjQUFjeUgsTUFBTTtRQUU1RSxJQUFJL0QsS0FBSzlLLFFBQVE2RixPQUFPLE1BQU07WUFDN0JxQixTQUFTO1lBQ1RqRCxNQUFNbkQsZ0JBQWdCUTtZQUN0QndOLE1BQU07WUFDTnZELFFBQVE7O1FBR1Q3RCxPQUFPQyxlQUFlbUQsSUFBSSxPQUFPO1lBQ2hDOUgsS0FBSyxZQUFVO2dCQUFDLE9BQU82SCxhQUFha0U7O1lBQ3BDN0ssS0FBSyxVQUFTNkQsT0FBTTtnQkFBQzhDLGFBQWFrRSxhQUFhaEg7OztRQUdoREwsT0FBT0MsZUFBZW1ELElBQUksU0FBUztZQUNsQzlILEtBQUssWUFBVTtnQkFBQyxPQUFPNkgsYUFBYUs7O1lBQ3BDaEgsS0FBSyxVQUFTNkQsT0FBTTtnQkFBQzhDLGFBQWFLLGVBQWVuRDs7Ozs7UUFNbEQyRDtRQUVBLFNBQVNBLE9BQU87WUFDZjVLLGdCQUFnQlMscUJBQ2QwQixLQUFLLFVBQVMwRCxHQUFHO2dCQUNqQm1FLEdBQUc3RyxPQUFPMEM7O1lBR1o3RixnQkFBZ0JXLEdBQUcsZUFBZXVOO1lBRWxDbkUsYUFBYXZDLFVBQ1pyRixLQUFLLFVBQVM2TCxNQUFLO2dCQUNuQmhFLEdBQUdnRSxPQUFPQTtnQkFDVmpFLGFBQWFrRSxhQUFhakUsR0FBR2dFLEtBQUs7Z0JBQ2xDRyxjQUFjbkUsR0FBR2dFLEtBQUs7O1lBR3ZCMUgsYUFBYTNGLEdBQUcsY0FBYyxVQUFTMEosR0FBR3RDLEtBQUk7O2dCQUU3Q29HLGNBQWNwRzs7O1FBTWhCLFNBQVNvRyxjQUFjcEcsS0FBSTtZQUMxQixPQUFPZ0MsYUFBYXRDLFVBQVVNLEtBQzVCNUYsS0FBSyxVQUFTc0ksUUFBTztnQkFDckJULEdBQUdTLFNBQVNBO2dCQUNaVixhQUFhSyxlQUFlSixHQUFHUyxPQUFPOzs7UUFJekMsU0FBU3lELGtCQUFrQi9LLE1BQU07WUFDaEM2RyxHQUFHN0csT0FBT0E7Ozs7S0FMUDtBQ3ZETCxDQUFDLFlBQVk7SUFDVDtLQUNDO0FDRkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESmpFLFFBQVFDLE9BQU8sY0FBYztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDZGlQLFNBQVMsT0FBTyxFQUNieE8sU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc29ja2V0JyxbJ2J0Zm9yZC5zb2NrZXQtaW8nXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52KSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cclxuICAgICAgICAgICAgbmFtZXNwYWNlID0gbmFtZXNwYWNlIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteVNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbXlTb2NrZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYnVpbGRlcjtcclxuXHJcbiAgICB9KVxyXG5cclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKXtcclxuICAgICAgICByZXR1cm4gc29ja2V0QnVpbGRlcigpO1xyXG4gICAgfSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdXJpdHknLCBbXSlcclxuICAgIC5mYWN0b3J5KCdzZWN1cml0eVNlcnZpY2UnLCBzZWN1cml0eVNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3VyaXR5U2VydmljZShzdG9yYWdlU2VydmljZSwgJHN0YXRlLCBodHRwQ2xpZW50LCAkcSkge1xyXG5cclxuICAgIHZhciBfY3VycmVudFVzZXIgPSBudWxsO1xyXG4gICAgdmFyIF9saXN0ZW5lcnMgPSB7fTtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBjdXJyZW50VXNlcjogZnVuY3Rpb24oKXtyZXR1cm4gX2N1cnJlbnRVc2VyO30sXHJcbiAgICAgICAgcmVxdWVzdEN1cnJlbnRVc2VyOiBfcmVxdWVzdEN1cnJlbnRVc2VyLFxyXG5cclxuICAgICAgICBvbjogYWRkTGlzdGVuZXIsXHJcblxyXG4gICAgICAgIGxvZ2luOiBfbG9naW4sXHJcbiAgICAgICAgbG9nb3V0OiBfbG9nb3V0XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpe1xyXG4gICAgICAgIGlmKCFfbGlzdGVuZXJzW2V2ZW50TmFtZV0pXHJcbiAgICAgICAgICAgIF9saXN0ZW5lcnNbZXZlbnROYW1lXSA9IFtdO1xyXG4gICAgICAgIF9saXN0ZW5lcnNbZXZlbnROYW1lXS5wdXNoKGxpc3RlbmVyKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGZpcmVFdmVudChldmVudE5hbWUsIGFyZ3Mpe1xyXG4gICAgICAgIHZhciBoYW5kbGVyID0gX2xpc3RlbmVyc1tldmVudE5hbWVdO1xyXG4gICAgICAgIGlmKCFoYW5kbGVyKSBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgZXZlbnRBcmdzID0gW10uc3BsaWNlLmNhbGwoYXJncywgMSk7XHJcbiAgICAgICAgaGFuZGxlci5mb3JFYWNoKGZ1bmN0aW9uKGNiKXtcclxuICAgICAgICAgICAgY2IoZXZlbnRBcmdzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfcmVxdWVzdEN1cnJlbnRVc2VyKHRva2VuKSB7XHJcblxyXG4gICAgICAgIGlmIChfY3VycmVudFVzZXIpXHJcbiAgICAgICAgICAgIHJldHVybiAkcS53aGVuKF9jdXJyZW50VXNlcik7XHJcblxyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAodG9rZW4pXHJcbiAgICAgICAgICAgIG9wdGlvbnMuYXV0aCA9IHtcclxuICAgICAgICAgICAgICAgICdCZWFyZXInOiB0b2tlblxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgICAgICBodHRwQ2xpZW50LmdldCgnL3Rva2Vucy9jdXJyZW50Jywgb3B0aW9ucylcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBfY3VycmVudFVzZXIgPSByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlc29sdmUocmVzcG9uc2UuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXIucmVzb2x2ZShudWxsKTtcclxuICAgICAgICAgICAgICAgIGRlZmVyLnJlamVjdChyZXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCwgcGVyc2lzdCkge1xyXG5cclxuICAgICAgICB2YXIgdGV4dCA9IGJ0b2EodXNlcm5hbWUgKyBcIjpcIiArIHBhc3N3b3JkKTtcclxuICAgICAgICB2YXIgdG9rZW4gPSBudWxsO1xyXG5cclxuICAgICAgICByZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvdG9rZW5zJywgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICdCYXNpYyc6IHRleHRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICB0b2tlbiA9IHJlcy5kYXRhLmF1dGhfdG9rZW47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pO1xyXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VTZXJ2aWNlLnNldChcImF1dGgtdG9rZW5cIiwgdG9rZW4sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dvdXQoKSB7XHJcbiAgICAgICAgc3RvcmFnZVNlcnZpY2UucmVtb3ZlKCd0b2tlbicpO1xyXG4gICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfc2V0VXNlcih1c2VyKXtcclxuICAgICAgICBfY3VycmVudFVzZXIgPSB1c2VyO1xyXG4gICAgICAgIGZpcmVFdmVudCgndXNlckNoYW5nZWQnLCB1c2VyKTtcclxuICAgIH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycsIFsndWkucm91dGVyJ10pO1xyXG5cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKS5ydW4oZGVidWdSb3V0ZXMpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGRlYnVnUm91dGVzKCRyb290U2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zKSB7XHJcbiAgICAvLyBDcmVkaXRzOiBBZGFtJ3MgYW5zd2VyIGluIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIwNzg2MjYyLzY5MzYyXHJcbiAgICAvLyBQYXN0ZSB0aGlzIGluIGJyb3dzZXIncyBjb25zb2xlXHJcblxyXG4gICAgLy92YXIgJHJvb3RTY29wZSA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiW3VpLXZpZXddXCIpWzBdKS5pbmplY3RvcigpLmdldCgnJHJvb3RTY29wZScpO1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG4gICAgJHJvb3RTY29wZS4kc3RhdGVQYXJhbXMgPSAkc3RhdGVQYXJhbXM7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZUVycm9yJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZUVycm9yIC0gZmlyZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMgZHVyaW5nIHRyYW5zaXRpb24uJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlTm90Rm91bmQnLCBmdW5jdGlvbiAoZXZlbnQsIHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJyRzdGF0ZU5vdEZvdW5kICcgKyB1bmZvdW5kU3RhdGUudG8gKyAnICAtIGZpcmVkIHdoZW4gYSBzdGF0ZSBjYW5ub3QgYmUgZm91bmQgYnkgaXRzIG5hbWUuJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN0YXJ0IHRvICcgKyB0b1N0YXRlLnRvICsgJy0gZmlyZWQgd2hlbiB0aGUgdHJhbnNpdGlvbiBiZWdpbnMuIHRvU3RhdGUsdG9QYXJhbXMgOiBcXG4nLCB0b1N0YXRlLCB0b1BhcmFtcyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VTdWNjZXNzIHRvICcgKyB0b1N0YXRlLm5hbWUgKyAnLSBmaXJlZCBvbmNlIHRoZSBzdGF0ZSB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLicpO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckdmlld0NvbnRlbnRMb2FkZWQgLSBmaXJlZCBhZnRlciBkb20gcmVuZGVyZWQnLCBldmVudCk7XHJcbiAgICAvLyB9KTtcclxuXHJcblxyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnKVxyXG5cdC5wcm92aWRlcignc2VjdGlvbk1hbmFnZXInLCBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN0aW9uTWFuYWdlclByb3ZpZGVyKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xyXG5cclxuXHR2YXIgY29uZmlnID0ge1xyXG5cdFx0cmVzb2x2ZUFsd2F5czoge31cclxuXHR9O1xyXG5cclxuXHR0aGlzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcblx0XHRhbmd1bGFyLmV4dGVuZChjb25maWcsIG9wdHMpO1xyXG5cdH07XHJcblxyXG5cdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcclxuXHJcblxyXG5cdHRoaXMuJGdldCA9IFNlY3Rpb25NYW5hZ2VyU2VydmljZTtcclxuXHJcblx0Ly8gQG5nSW5qZWN0XHJcblx0ZnVuY3Rpb24gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlKCRyb290U2NvcGUsICRzdGF0ZSkge1xyXG5cclxuXHQgICAgdmFyIF9zZWN0aW9ucyA9IFtdO1xyXG5cclxuXHRcdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0XHRnZXRTZWN0aW9uczogZ2V0U2VjdGlvbnMsXHJcblx0XHRcdHJlZ2lzdGVyOiByZWdpc3RlclNlY3Rpb25zLFxyXG4gICAgICAgICAgICBnZXRNb2R1bGVzOiBnZXRNb2R1bGVzXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbnMoc2VjdGlvbnMpIHtcclxuXHRcdFx0c2VjdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcclxuXHJcblx0XHRcdFx0aWYoc3RhdGUucGFyZW50ID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHRzdGF0ZS5wYXJlbnQgPSAnYXBwLXJvb3QnO1xyXG5cclxuXHRcdFx0XHRzdGF0ZS5yZXNvbHZlID1cclxuXHRcdFx0XHRcdGFuZ3VsYXIuZXh0ZW5kKHN0YXRlLnJlc29sdmUgfHwge30sIGNvbmZpZy5yZXNvbHZlQWx3YXlzKTtcclxuXHRcdFx0XHQkc3RhdGVQcm92aWRlci5zdGF0ZShzdGF0ZSk7XHJcblx0XHRcdFx0X3NlY3Rpb25zLnB1c2goc3RhdGUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRNb2R1bGVzKCkge1xyXG5cdFx0ICAgIHJldHVybiAkc3RhdGUuZ2V0KCkuZmlsdGVyKGZ1bmN0aW9uICh4KSB7XHJcblx0XHQgICAgICAgIHJldHVybiB4LnNldHRpbmdzICYmIHguc2V0dGluZ3MubW9kdWxlO1xyXG5cdFx0ICAgIH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldFNlY3Rpb25zKCkge1xyXG5cdFx0ICAgIC8vcmV0dXJuICRzdGF0ZS5nZXQoKTtcclxuXHRcdCAgICByZXR1cm4gX3NlY3Rpb25zO1xyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycsIFtdKTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJylcclxuICAgIC5zZXJ2aWNlKCdsb2dnZXInLCBsb2dnZXJTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBsb2dnZXJTZXJ2aWNlKCRsb2cpIHtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHtcclxuICAgICAgICBpbmZvOiBpbmZvLFxyXG4gICAgICAgIHdhcm5pbmc6IHdhcm5pbmcsXHJcbiAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgIGxvZzogJGxvZ1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gaW5mbyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdJbmZvOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gd2FybmluZyhtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5pbmZvKCdXQVJOSU5HOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuZXJyb3IoJ0VSUk9SOiAnICsgbWVzc2FnZSwgZGF0YSk7XHJcbiAgICB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhdGEnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJylcclxuXHQuZmFjdG9yeSgndXRpbCcsIFV0aWxTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFV0aWxTZXJ2aWNlKGV2ZW50U2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGFkZFByb3BlcnR5OiBhZGRQcm9wZXJ0eVxyXG5cdH07XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBhZGRQcm9wZXJ0eShvYmosIG5hbWUsIGdldHRlciwgc2V0dGVyKSB7XHJcblxyXG5cclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcclxuXHRcdFx0Z2V0OiBnZXR0ZXIgfHwgY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSksXHJcblx0XHRcdHNldDogc2V0dGVyIHx8IGNyZWF0ZVNldHRlcihvYmosIG5hbWUpXHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBjcmVhdGVHZXR0ZXIob2JqLCBuYW1lKSB7XHJcblx0XHRcdHZhciBmaWVsZCA9ICdfJyArIG5hbWU7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gb2JqW2ZpZWxkXTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKSB7XHJcblx0XHRcdHZhciBmaWVsZCA9ICdfJyArIG5hbWU7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cclxuXHRcdFx0XHR2YXIgb2xkVmFsdWUgPSBvYmpbZmllbGRdO1xyXG5cclxuXHRcdFx0XHRvYmpbZmllbGRdID0gdmFsdWU7XHJcblx0XHRcdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKG5hbWUgKyAnQ2hhbmdlZCcsIHtcclxuXHRcdFx0XHRcdG9iajogb2JqLFxyXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlLFxyXG5cdFx0XHRcdFx0b3JpZ2luYWxWYWx1ZTogb2xkVmFsdWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhdGEnKVxyXG5cdC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFN0b3JlU2VydmljZShodHRwQ2xpZW50LCBldmVudFNlcnZpY2UsICRxKSB7XHJcblxyXG5cdHZhciBfY3VycmVudFN0b3JlO1xyXG5cdHZhciBfY3VycmVudE9yZztcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRnZXRPcmdzOiBnZXRPcmdzLFxyXG5cdFx0Z2V0U3RvcmVzOiBnZXRTdG9yZXMsXHJcblx0fTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50T3JnJywge1xyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZSxcclxuXHRcdGdldDogZ2V0X2N1cnJlbnRPcmcsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50T3JnXHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudFN0b3JlJywge1xyXG5cdFx0Z2V0OiBnZXRfY3VycmVudFN0b3JlLFxyXG5cdFx0c2V0OiBzZXRfY3VycmVudFN0b3JlXHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBnZXRPcmdzKCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRTdG9yZXMob3JnKSB7XHJcblxyXG5cdFx0aWYoIW9yZyB8fCAhb3JnLl9pZClcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oW10pO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL29yZ2FuaXphdGlvbnMvJyArIG9yZy5faWQgKyAnL3N0b3JlcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudE9yZygpIHtcclxuXHRcdHJldHVybiBfY3VycmVudE9yZztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50T3JnKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50T3JnID09PSB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdF9jdXJyZW50T3JnID0gdmFsdWU7XHJcblx0XHRldmVudFNlcnZpY2UucmFpc2UoJ29yZ0NoYW5nZWQnLCBfY3VycmVudE9yZyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudFN0b3JlKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50U3RvcmU7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRfY3VycmVudFN0b3JlKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50U3RvcmUgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRTdG9yZSA9IHZhbHVlO1xyXG5cdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKCdzdG9yZUNoYW5nZWQnLCBfY3VycmVudFN0b3JlKTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicsXHJcbiAgICBbXHJcbiAgICAgICAgJ2FwcC5jb25maWcnLFxyXG4gICAgICAgICdhcHAubGF5b3V0JyxcclxuICAgICAgICAnYXBwLmxvZ2dpbmcnLFxyXG4gICAgICAgICdhcHAuc2VjdGlvbnMnLFxyXG4gICAgICAgICdhcHAuc2VjdXJpdHknLFxyXG4gICAgICAgICdhcHAuZGF0YScsXHJcbiAgICAgICAgJ2FwcC5zb2NrZXQnLFxyXG4gICAgICAgICdzb2xvbW9uLnBhcnRpYWxzJyxcclxuICAgICAgICAnYXBwLmRhc2hib2FyZCcsXHJcbiAgICAgICAgJ2FwcC5zdG9yZXMnLFxyXG4gICAgICAgICdhcHAudGFza3MnLFxyXG4gICAgICAgICdhcHAuY2hhdCcsXHJcbiAgICAgICAgJ2FwcC5lbXBsb3llZXMnLFxyXG4gICAgICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgICAgICduZ0FuaW1hdGUnXHJcbiAgICBdKTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJylcclxuLmNvbmZpZyhjb25maWcpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGNvbmZpZyhodHRwQ2xpZW50UHJvdmlkZXIsICRodHRwUHJvdmlkZXIpe1xyXG5cdGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIjtcclxuXHJcbiAgICAgICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcclxuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcclxuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuY2FjaGUgPSB0cnVlO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG5cdC5kaXJlY3RpdmUoJ3VpU3RhdGUnLCB1aVN0YXRlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiB1aVN0YXRlKCRzdGF0ZSkge1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdBJyxcclxuXHRcdGxpbms6IGxpbmssXHJcblx0XHRyZXF1aXJlOiAnP151aVNyZWZBY3RpdmUnXHJcblx0fTtcclxuIFxyXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB1aVNyZWZBY3RpdmUpIHtcclxuXHJcblx0XHR2YXIgbmFtZSA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGUpO1xyXG5cdFx0dmFyIHBhcmFtcyA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGVQYXJhbXMpO1xyXG5cclxuXHRcdHZhciB1cmwgPSAkc3RhdGUuaHJlZihuYW1lLCBwYXJhbXMpO1xyXG5cclxuXHRcdGlmKHVybCA9PT0gXCJcIilcclxuXHRcdFx0dXJsID0gXCIvXCI7XHJcblxyXG5cdFx0YXR0cnMuJHNldCgnaHJlZicsIHVybCk7XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnLCBbJ2FwcC5kYXRhJ10pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICd0YXNrcycsXHJcblx0XHR1cmw6ICcvdGFza3MnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Rhc2tMaXN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90YXNrcy90YXNrbGlzdC5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDMsXHJcblx0XHRcdGljb246IFsnZ2x5cGhpY29uJywnZ2x5cGhpY29uLXRhZ3MnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycpXHJcblx0LmNvbnRyb2xsZXIoJ1Rhc2tMaXN0Q29udHJvbGxlcicsIFRhc2tMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gVGFza0xpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHRhc2tzOiBudWxsXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHRyZWZyZXNoVGFza3Moc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoVGFza3Moc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaFRhc2tzKHN0b3JlKSB7XHJcblxyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS50YXNrcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLnRhc2tzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJywgWyd1aS5yb3V0ZXInXSlcclxuLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnc3RvcmVzJyxcclxuICAgICAgICAgICAgdXJsOiAnL3N0b3JlcycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdG9yZXNDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9zdG9yZXMvc3RvcmVzLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDIsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tbWFwLW1hcmtlciddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnKVxyXG4uY29udHJvbGxlcignU3RvcmVzQ29udHJvbGxlcicsIFN0b3Jlc0NvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gU3RvcmVzQ29udHJvbGxlcihodHRwQ2xpZW50KXtcclxuXHRcclxuXHR2YXIgdm0gPSB0aGlzO1xyXG5cclxuXHR2bS5zdG9yZXMgPSBbXTtcclxuXHR2bS5zZWxlY3RlZCA9IG51bGw7XHJcblx0dm0udGFza3MgPSBbXTtcclxuXHJcblx0dm0uc2VsZWN0ID0gZnVuY3Rpb24oc3RvcmUpe1xyXG5cdFx0dm0uc2VsZWN0ZWQgPSBzdG9yZTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS50YXNrcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS5zdG9yZXMgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcsIFsndWkuYm9vdHN0cmFwJywgJ3VpLnJvdXRlciddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKFtcclxuXHJcbiAgICBdKTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbi5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBMb2dpbkNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvZ2luQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsICRzdGF0ZSl7XHJcblx0XHJcblx0dmFyIHZtID10aGlzO1xyXG5cdHZtLmxvZ2luID0ge1xyXG5cdFx0dXNlcm5hbWU6IFwiXCIsXHJcblx0XHRwYXNzd29yZDogXCJcIixcclxuXHRcdHJlbWVtYmVyTWU6IGZhbHNlXHJcblx0fTtcclxuXHJcblx0dGhpcy5idXN5ID0gZmFsc2U7XHJcblx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmJ1c3kgPSB0cnVlO1xyXG5cdFx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UubG9naW4odm0ubG9naW4udXNlcm5hbWUsIHZtLmxvZ2luLnBhc3N3b3JkLCB2bS5sb2dpbi5yZW1lbWJlck1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXQpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdFx0dm0ubWVzc2FnZSA9IChleC5kYXRhICYmIGV4LmRhdGEubWVzc2FnZSkgfHwgXCJVbmFibGUgdG8gbG9nIGluXCI7XHJcblxyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dm0uYnVzeSA9IGZhbHNlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0fTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycsIFsnYXBwLmRhdGEnXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRSb3V0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJvdXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2VtcGxveWVlcycsXHJcblx0XHR1cmw6ICcvZW1wbG95ZWVzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFbXBsb3llZXNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiA0LFxyXG5cdFx0XHRpY29uOiBbJ2ZhJywgJ2ZhLXVzZXJzJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJylcclxuXHQuY29udHJvbGxlcignRW1wbG95ZWVzQ29udHJvbGxlcicsIEVtcGxveWVlc0NvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEVtcGxveWVlc0NvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIGh0dHBDbGllbnQpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZW1wbG95ZWVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0Ly8gcmVmcmVzaEVtcGxveWVlcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hFbXBsb3llZXMoc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaEVtcGxveWVlcyhzdG9yZSkge1xyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS5lbXBsb3llZXMgPSBbXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvZW1wbG95ZWVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uZW1wbG95ZWVzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcsWydhcHAuc29ja2V0J10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGpvaW46IGpvaW4sXHJcblx0XHRsZWF2ZTogbGVhdmVcclxuXHR9XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGlkLCBtZXNzYWdlKSB7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvY2hhdC8nICsgaWQgKyAnL21lc3NhZ2VzJztcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCB7bWVzc2FnZTogbWVzc2FnZX0se30pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBqb2luKGlkKXtcclxuXHRcdHNvY2tldC5lbWl0KCdqb2luJywge2lkOiBpZH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbGVhdmUoaWQpe1xyXG5cdFx0c29ja2V0LmVtaXQoJ2xlYXZlJywge2lkOiBpZH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcbi5ydW4oY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoc2VjdGlvbk1hbmFnZXIpe1xyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCl7XHJcblx0cmV0dXJuIFt7XHJcblx0XHRuYW1lOiAnY2hhdC1saXN0JyxcclxuXHRcdHVybDogJy9jaGF0cycsXHJcblx0XHRjb250cm9sbGVyOiAnQ2hhdExpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdC1saXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogNCxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCAnZ2x5cGhpY29uLWNsb3VkJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmNvbnRyb2xsZXIoJ0NoYXRMaXN0Q29udHJvbGxlcicsIENoYXRMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdExpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlLCBjaGF0U2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRjaGF0czogbnVsbCxcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGpvaW46IGpvaW4sXHJcblx0XHRsZWF2ZTogbGVhdmVcclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpe1xyXG5cclxuXHRcdHZhciBjaGF0ID0gZ2V0Q2hhdChtc2cuY2hhdCk7XHJcblx0XHRjaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0dGltZTogbXNnLmRhdGUsXHJcblx0XHRcdHVzZXI6IG1zZy5mcm9tXHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hDaGF0cyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoQ2hhdHMoc3RvcmUpIHtcclxuXHRcdGlmICghc3RvcmUpXHJcblx0XHRcdHJldHVybiB2bS50YXNrcyA9IFtdO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL2NoYXQnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gdm0uY2hhdHMgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBqb2luKGNoYXQpe1xyXG5cdFx0Y2hhdFNlcnZpY2Uuam9pbihjaGF0Ll9pZCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBsZWF2ZShjaGF0KXtcclxuXHRcdGNoYXRTZXJ2aWNlLmxlYXZlKGNoYXQuX2lkKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGNoYXQsIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0Ll9pZCwgbWVzc2FnZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly8gY2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHQvLyBcdG1lc3NhZ2U6IG1lc3NhZ2UsXHJcblx0XHRcdFx0Ly8gXHRzZW50OiB0cnVlXHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXgpO1xyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2hhdC5jdXJyZW50TWVzc2FnZSA9ICcnO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldENoYXQoaWQpe1xyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHZtLmNoYXRzLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0aWYodm0uY2hhdHNbaV0uX2lkID09IGlkKVxyXG5cdFx0XHRcdHJldHVybiB2bS5jaGF0c1tpXTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMSxcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1zdGF0cyddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJylcclxuICAgIC5jb250cm9sbGVyKCdEYXNoYm9hcmRDb250cm9sbGVyJywgRGFzaGJvYXJkQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRGFzaGJvYXJkQ29udHJvbGxlcigpIHtcclxuICAgIHRoaXMubWVzc2FnZSA9IFwiSGVsbG8gV29ybGRcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29udHJvbGxlcignQXNpZGVDb250cm9sbGVyJywgQXNpZGVDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBBc2lkZUNvbnRyb2xsZXIoc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0c2VjdGlvbnM6IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKVxyXG5cdH0pO1xyXG5cclxuXHQvL3ZtLnNlY3Rpb25zID0gc2VjdGlvbk1hbmFnZXIuZ2V0TW9kdWxlcygpO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ1NoZWxsQ29udHJvbGxlcicsIFNoZWxsQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU2hlbGxDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgLy92YXIgdm0gPSB0aGlzO1xyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb25maWcoaW5pdGlhbGl6ZVN0YXRlcylcclxuXHQucnVuKGVuc3VyZUF1dGhlbnRpY2F0ZWQpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGVuc3VyZUF1dGhlbnRpY2F0ZWQoJHJvb3RTY29wZSwgJHN0YXRlLCBzZWN1cml0eVNlcnZpY2UsICR0aW1lb3V0KSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB1c2VyID0gc2VjdXJpdHlTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XHJcblx0XHRpZiAodXNlcikge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcblx0XHRcdFx0dmFyIHRhcmdldFN0YXRlID0gdSA/IHRvU3RhdGUgOiAnbG9naW4nO1xyXG5cclxuXHRcdFx0XHQkc3RhdGUuZ28odGFyZ2V0U3RhdGUpO1xyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHZhciB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHRcdFxyXG5cdFx0aWYoISRyb290U2NvcGUuc2hvd1NwbGFzaClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHdhaXRpbmdGb3JWaWV3ID0gdHJ1ZTtcclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcclxuXHJcblxyXG5cdFx0aWYgKHdhaXRpbmdGb3JWaWV3ICYmICRyb290U2NvcGUuc2hvd1NwbGFzaCkge1xyXG5cdFx0XHR3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3Nob3dTcGxhc2ggPSBmYWxzZScpO1xyXG5cdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHR9LCAxMCk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufVxyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVTdGF0ZXMoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG5cclxuXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG5cclxuXHQkc3RhdGVQcm92aWRlclxyXG5cdFx0LnN0YXRlKCdyb290Jywge1xyXG5cdFx0XHR1cmw6ICcnLFxyXG5cdFx0XHRhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdFx0dGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+JyxcclxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG5cdFx0XHRcdGlmICgkcm9vdFNjb3BlLnNob3dTcGxhc2ggPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblx0XHRcdH0sXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvLyBAbmdJbmplY3RcclxuXHRcdFx0XHR1c2VyOiBmdW5jdGlvbihzZWN1cml0eVNlcnZpY2UpIHtcclxuXHRcdFx0XHRcdHJldHVybiBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkVudGVyOiAvKiBAbmdJbmplY3QgKi8gZnVuY3Rpb24oJHN0YXRlLCB1c2VyKSB7XHJcblx0XHRcdFx0Ly8gaWYodXNlcilcclxuXHRcdFx0XHQvLyAgICAgcmV0dXJuICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHRcdC8vICRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdC5zdGF0ZSgnbG9naW4nLCB7XHJcblx0XHRcdC8vIHVybDogJycsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdMb2dpbkNvbnRyb2xsZXInLFxyXG5cdFx0XHRjb250cm9sbGVyQXM6IFwidm1cIixcclxuXHRcdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbG9naW4vbG9naW4uaHRtbCdcclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2FwcC1yb290Jywge1xyXG5cdFx0XHQvL3VybDogJycsXHJcblx0XHRcdHBhcmVudDogJ3Jvb3QnLFxyXG5cdFx0XHRhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdFx0Y29udHJvbGxlcjogJ1NoZWxsQ29udHJvbGxlcicsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2xheW91dC9zaGVsbC5odG1sJyxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdC8vdXNlcjogZnVuY3Rpb24oKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkVudGVyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnU2hlbGxDb250cm9sbGVyLm9uRW50ZXInKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0hlYWRlckNvbnRyb2xsZXInLCBIZWFkZXJDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBIZWFkZXJDb250cm9sbGVyKHNlY3VyaXR5U2VydmljZSwgc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIHV0aWwpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0bWVzc2FnZTogXCJIZWxsbyBIZWFkZXJcIixcclxuXHRcdHVzZXI6IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcixcclxuXHRcdG9yZ3M6IFtdLFxyXG5cdFx0c3RvcmVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkodm0sICdvcmcnLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHN0b3JlU2VydmljZS5jdXJyZW50T3JnO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudE9yZyA9IHZhbHVlO31cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnc3RvcmUnLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmU7fSxcclxuXHRcdHNldDogZnVuY3Rpb24odmFsdWUpe3N0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdC8vdXRpbC5hZGRQcm9wZXJ0eSh2bSwgJ29yZycpO1xyXG5cdC8vdXRpbC5hZGRQcm9wZXJ0eSh2bSwgJ3N0b3JlJyk7XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpIHtcclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih4KSB7XHJcblx0XHRcdFx0dm0udXNlciA9IHg7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5vbigndXNlckNoYW5nZWQnLCBoYW5kbGVVc2VyQ2hhbmdlZCk7XHJcblxyXG5cdFx0c3RvcmVTZXJ2aWNlLmdldE9yZ3MoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ob3Jncyl7XHJcblx0XHRcdHZtLm9yZ3MgPSBvcmdzO1xyXG5cdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudE9yZyA9IHZtLm9yZ3NbMF07XHJcblx0XHRcdHJlZnJlc2hTdG9yZXModm0ub3Jnc1swXSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRldmVudFNlcnZpY2Uub24oJ29yZ0NoYW5nZWQnLCBmdW5jdGlvbihlLCBvcmcpe1xyXG5cdFx0XHQvL3ZtLm9yZyA9IG9yZztcclxuXHRcdFx0cmVmcmVzaFN0b3JlcyhvcmcpO1xyXG5cdFx0XHRcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hTdG9yZXMob3JnKXtcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0U3RvcmVzKG9yZylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmVzKXtcclxuXHRcdFx0XHR2bS5zdG9yZXMgPSBzdG9yZXM7XHJcblx0XHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSA9IHZtLnN0b3Jlc1swXTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVVc2VyQ2hhbmdlZCh1c2VyKSB7XHJcblx0XHR2bS51c2VyID0gdXNlcjtcclxuXHR9XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=