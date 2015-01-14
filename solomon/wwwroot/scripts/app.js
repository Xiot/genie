(function () {
    'use strict';
    angular.module('app.socket', [
        'btford.socket-io',
        'symbiote.common'
    ]);
}());
(function () {
    'use strict';
    angular.module('app.socket').factory('socketBuilder', ["socketFactory", "env", "storageService", function (socketFactory, env, storageService) {
        var builder = function (namespace) {
            namespace = namespace || '';
            var device = storageService.get('device-id');
            // if this is undefined then generate a new device key
            // should be seperated into a different service.
            var myIoSocket = io.connect(env.apiRoot + namespace, { query: 'device=' + device });
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
    angular.module('app.data', []);
}());
(function () {
    'use strict';
    angular.module('app.data').factory('util', UtilService);
    function UtilService(eventService) {
        var service = {
            addProperty: addProperty,
            uuid: generateUUID
        };
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
                        property: name,
                        value: value,
                        originalValue: oldValue
                    });
                };
            }
        }
        function generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : r & 3 | 8).toString(16);
            });
            return uuid;
        }
        ;
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
            return httpClient.post(url, { message: message }).then(function (res) {
                return res.data;
            });
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
                time: msg.time,
                user: msg.user
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
            return chatService.sendMessage(chat._id, message).then(function (msg) {
                chat.messages.push({
                    message: msg.message,
                    time: msg.time,
                    user: msg.user,
                    sent: true
                });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJjb21tb24vZGF0YS9kYXRhLm1vZHVsZS5qcyIsImNvbW1vbi9kYXRhL3V0aWwuanMiLCJjb21tb24vZGF0YS9zdG9yZVNlcnZpY2UuanMiLCJhcmVhcy90YXNrcy90YXNrcy5tb2R1bGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5yb3V0ZXMuanMiLCJhcmVhcy90YXNrcy90YXNrbGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMubW9kdWxlLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5yb3V0ZXMuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvc29ja2V0QnVpbGRlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5tb2R1bGUuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5yb3V0ZXMuanMiLCJhcmVhcy9jaGF0L2NoYXQuY29udHJvbGxlci5qcyIsImFyZWFzL2FzaWRlL2FzaWRlLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwibGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIiwiY29uZmlnL2NvbmZpZy5tb2R1bGUuanMiLCJlbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsInNvY2tldEZhY3RvcnkiLCJlbnYiLCJzdG9yYWdlU2VydmljZSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJkZXZpY2UiLCJnZXQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwiYXBpUm9vdCIsInF1ZXJ5IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJzZWN1cml0eVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJfbGlzdGVuZXJzIiwic2VydmljZSIsImN1cnJlbnRVc2VyIiwicmVxdWVzdEN1cnJlbnRVc2VyIiwiX3JlcXVlc3RDdXJyZW50VXNlciIsIm9uIiwiYWRkTGlzdGVuZXIiLCJsb2dpbiIsIl9sb2dpbiIsImxvZ291dCIsIl9sb2dvdXQiLCJldmVudE5hbWUiLCJsaXN0ZW5lciIsInB1c2giLCJmaXJlRXZlbnQiLCJhcmdzIiwiaGFuZGxlciIsImV2ZW50QXJncyIsInNwbGljZSIsImNhbGwiLCJmb3JFYWNoIiwiY2IiLCJ0b2tlbiIsIndoZW4iLCJvcHRpb25zIiwiY2FjaGUiLCJhdXRoIiwiZGVmZXIiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwicmVzb2x2ZSIsImNhdGNoIiwicmVzIiwic3RhdHVzIiwicmVqZWN0IiwicHJvbWlzZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJwZXJzaXN0IiwidGV4dCIsImJ0b2EiLCJwb3N0IiwiYXV0aF90b2tlbiIsInVzZXIiLCJzZXQiLCJyZW1vdmUiLCJnbyIsIl9zZXRVc2VyIiwicnVuIiwiZGVidWdSb3V0ZXMiLCIkcm9vdFNjb3BlIiwiJHN0YXRlUGFyYW1zIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJmcm9tU3RhdGUiLCJmcm9tUGFyYW1zIiwiY29uc29sZSIsImxvZyIsImFyZ3VtZW50cyIsInVuZm91bmRTdGF0ZSIsInRvIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsImdldFNlY3Rpb25zIiwicmVnaXN0ZXIiLCJyZWdpc3RlclNlY3Rpb25zIiwiZ2V0TW9kdWxlcyIsInNlY3Rpb25zIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJ4Iiwic2V0dGluZ3MiLCJsb2dnZXJTZXJ2aWNlIiwiJGxvZyIsImluZm8iLCJ3YXJuaW5nIiwiZXJyb3IiLCJtZXNzYWdlIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsImJhc2VVcmkiLCJkZWZhdWx0cyIsInVzZVhEb21haW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJkaXJlY3RpdmUiLCJ1aVN0YXRlIiwicmVzdHJpY3QiLCJsaW5rIiwicmVxdWlyZSIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwidWlTcmVmQWN0aXZlIiwibmFtZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiVXRpbFNlcnZpY2UiLCJldmVudFNlcnZpY2UiLCJhZGRQcm9wZXJ0eSIsInV1aWQiLCJnZW5lcmF0ZVVVSUQiLCJvYmoiLCJnZXR0ZXIiLCJzZXR0ZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImNyZWF0ZUdldHRlciIsImNyZWF0ZVNldHRlciIsImZpZWxkIiwidmFsdWUiLCJvbGRWYWx1ZSIsInJhaXNlIiwicHJvcGVydHkiLCJvcmlnaW5hbFZhbHVlIiwiZCIsIkRhdGUiLCJnZXRUaW1lIiwicmVwbGFjZSIsImMiLCJyIiwiTWF0aCIsInJhbmRvbSIsImZsb29yIiwidG9TdHJpbmciLCJTdG9yZVNlcnZpY2UiLCJfY3VycmVudFN0b3JlIiwiX2N1cnJlbnRPcmciLCJnZXRPcmdzIiwiZ2V0U3RvcmVzIiwiZW51bWVyYWJsZSIsImdldF9jdXJyZW50T3JnIiwic2V0X2N1cnJlbnRPcmciLCJnZXRfY3VycmVudFN0b3JlIiwic2V0X2N1cnJlbnRTdG9yZSIsIm9yZyIsIl9pZCIsImFwcFJ1biIsInNlY3Rpb25NYW5hZ2VyIiwiZ2V0U3RhdGVzIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwib3JkZXIiLCJpY29uIiwiVGFza0xpc3RDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwidm0iLCJ0YXNrcyIsIm9uU3RvcmVDaGFuZ2VkIiwicmVmcmVzaFRhc2tzIiwiY3VycmVudFN0b3JlIiwiZSIsInN0b3JlIiwiaWQiLCJTdG9yZXNDb250cm9sbGVyIiwic3RvcmVzIiwic2VsZWN0ZWQiLCJzZWxlY3QiLCJpbml0IiwiTG9naW5Db250cm9sbGVyIiwicmVtZW1iZXJNZSIsImJ1c3kiLCJyZXQiLCJleCIsImZpbmFsbHkiLCJjb25maWd1cmVSb3V0ZXMiLCJnZXRSb3V0ZXMiLCJFbXBsb3llZXNDb250cm9sbGVyIiwiZW1wbG95ZWVzIiwicmVmcmVzaEVtcGxveWVlcyIsIkRhc2hib2FyZENvbnRyb2xsZXIiLCJDaGF0RmFjdG9yeSIsInNvY2tldCIsInNlbmRNZXNzYWdlIiwiam9pbiIsImxlYXZlIiwiZW1pdCIsIiRlbWl0IiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdFNlcnZpY2UiLCJjaGF0cyIsIm1zZyIsImNoYXQiLCJnZXRDaGF0IiwibWVzc2FnZXMiLCJ0aW1lIiwicmVmcmVzaENoYXRzIiwic2VudCIsImN1cnJlbnRNZXNzYWdlIiwiaSIsImxlbmd0aCIsIkFzaWRlQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsImluaXRpYWxpemVTdGF0ZXMiLCJlbnN1cmVBdXRoZW50aWNhdGVkIiwiJHRpbWVvdXQiLCJzaG93U3BsYXNoIiwicHJldmVudERlZmF1bHQiLCJ1IiwidGFyZ2V0U3RhdGUiLCJ3YWl0aW5nRm9yVmlldyIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIm90aGVyd2lzZSIsImFic3RyYWN0IiwidGVtcGxhdGUiLCIkc2NvcGUiLCJvbkVudGVyIiwiSGVhZGVyQ29udHJvbGxlciIsInV0aWwiLCJvcmdzIiwiY3VycmVudE9yZyIsImhhbmRsZVVzZXJDaGFuZ2VkIiwicmVmcmVzaFN0b3JlcyIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQURKQSxRQUFRQyxPQUFPLGNBQWE7UUFDM0I7UUFDQTs7S0FJSTtBQ05MLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDVkMsUUFBUSw0REFBaUIsVUFBVUMsZUFBZUMsS0FBS0MsZ0JBQWdCO1FBRXBFLElBQUlDLFVBQVUsVUFBVUMsV0FBVztZQUUvQkEsWUFBWUEsYUFBYTtZQUV6QixJQUFJQyxTQUFTSCxlQUFlSSxJQUFJOzs7WUFLaEMsSUFBSUMsYUFBYUMsR0FBR0MsUUFBUVIsSUFBSVMsVUFBVU4sV0FBVyxFQUNqRE8sT0FBTyxZQUFZTjtZQUd2QixJQUFJTyxXQUFXWixjQUFjLEVBQ3pCYSxVQUFVTjtZQUdkLE9BQU9LOztRQUdYLE9BQU9UO1FBSVZKLFFBQVEsNEJBQVUsVUFBU2UsZUFBYztRQUN0QyxPQUFPQTs7S0FaVjtBQ2hCTCxDQUFDLFlBQVk7SUFDVDtJQURKakIsUUFBUUMsT0FBTyxnQkFBZ0Is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OztRQU1oQixTQUFTOEUsY0FBYzlFLEtBQUk7WUFDMUIsT0FBT1csYUFBYWpCLFVBQVVNLEtBQzVCOUgsS0FBSyxVQUFTbUosUUFBTztnQkFDckJULEdBQUdTLFNBQVNBO2dCQUNaVixhQUFhSyxlQUFlSixHQUFHUyxPQUFPOzs7UUFJekMsU0FBU3dELGtCQUFrQjNMLE1BQU07WUFDaEMwSCxHQUFHMUgsT0FBT0E7Ozs7S0FMUDtBQ3ZETCxDQUFDLFlBQVk7SUFDVDtLQUNDO0FDRkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5FLFFBQVFDLE9BQU8sY0FBYztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDZCtQLFNBQVMsT0FBTyxFQUNiblAsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc29ja2V0JyxbXHJcblx0J2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cdCdzeW1iaW90ZS5jb21tb24nXHJcblx0XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52LCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZS1pZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyB1bmRlZmluZWQgdGhlbiBnZW5lcmF0ZSBhIG5ldyBkZXZpY2Uga2V5XHJcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBzZXBlcmF0ZWQgaW50byBhIGRpZmZlcmVudCBzZXJ2aWNlLlxyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpe1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN1cml0eScsIFtdKVxyXG4gICAgLmZhY3RvcnkoJ3NlY3VyaXR5U2VydmljZScsIHNlY3VyaXR5U2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdXJpdHlTZXJ2aWNlKHN0b3JhZ2VTZXJ2aWNlLCAkc3RhdGUsIGh0dHBDbGllbnQsICRxKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50VXNlciA9IG51bGw7XHJcbiAgICB2YXIgX2xpc3RlbmVycyA9IHt9O1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGN1cnJlbnRVc2VyOiBmdW5jdGlvbigpe3JldHVybiBfY3VycmVudFVzZXI7fSxcclxuICAgICAgICByZXF1ZXN0Q3VycmVudFVzZXI6IF9yZXF1ZXN0Q3VycmVudFVzZXIsXHJcblxyXG4gICAgICAgIG9uOiBhZGRMaXN0ZW5lcixcclxuXHJcbiAgICAgICAgbG9naW46IF9sb2dpbixcclxuICAgICAgICBsb2dvdXQ6IF9sb2dvdXRcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcil7XHJcbiAgICAgICAgaWYoIV9saXN0ZW5lcnNbZXZlbnROYW1lXSlcclxuICAgICAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZmlyZUV2ZW50KGV2ZW50TmFtZSwgYXJncyl7XHJcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBfbGlzdGVuZXJzW2V2ZW50TmFtZV07XHJcbiAgICAgICAgaWYoIWhhbmRsZXIpIFxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBldmVudEFyZ3MgPSBbXS5zcGxpY2UuY2FsbChhcmdzLCAxKTtcclxuICAgICAgICBoYW5kbGVyLmZvckVhY2goZnVuY3Rpb24oY2Ipe1xyXG4gICAgICAgICAgICBjYihldmVudEFyZ3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pIHtcclxuXHJcbiAgICAgICAgaWYgKF9jdXJyZW50VXNlcilcclxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oX2N1cnJlbnRVc2VyKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0b2tlbilcclxuICAgICAgICAgICAgb3B0aW9ucy5hdXRoID0ge1xyXG4gICAgICAgICAgICAgICAgJ0JlYXJlcic6IHRva2VuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgICAgIGh0dHBDbGllbnQuZ2V0KCcvdG9rZW5zL2N1cnJlbnQnLCBvcHRpb25zKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIF9jdXJyZW50VXNlciA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkLCBwZXJzaXN0KSB7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0ID0gYnRvYSh1c2VybmFtZSArIFwiOlwiICsgcGFzc3dvcmQpO1xyXG4gICAgICAgIHZhciB0b2tlbiA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiBodHRwQ2xpZW50LnBvc3QoJy90b2tlbnMnLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ0Jhc2ljJzogdGV4dFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRva2VuID0gcmVzLmRhdGEuYXV0aF90b2tlbjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbik7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZVNlcnZpY2Uuc2V0KFwiYXV0aC10b2tlblwiLCB0b2tlbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ291dCgpIHtcclxuICAgICAgICBzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3Rva2VuJyk7XHJcbiAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9zZXRVc2VyKHVzZXIpe1xyXG4gICAgICAgIF9jdXJyZW50VXNlciA9IHVzZXI7XHJcbiAgICAgICAgZmlyZUV2ZW50KCd1c2VyQ2hhbmdlZCcsIHVzZXIpO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpLnJ1bihkZWJ1Z1JvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZGVidWdSb3V0ZXMoJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgIC8vIENyZWRpdHM6IEFkYW0ncyBhbnN3ZXIgaW4gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3ODYyNjIvNjkzNjJcclxuICAgIC8vIFBhc3RlIHRoaXMgaW4gYnJvd3NlcidzIGNvbnNvbGVcclxuXHJcbiAgICAvL3ZhciAkcm9vdFNjb3BlID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdWktdmlld11cIilbMF0pLmluamVjdG9yKCkuZ2V0KCckcm9vdFNjb3BlJyk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlTm90Rm91bmQgJyArIHVuZm91bmRTdGF0ZS50byArICcgIC0gZmlyZWQgd2hlbiBhIHN0YXRlIGNhbm5vdCBiZSBmb3VuZCBieSBpdHMgbmFtZS4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3RhcnQgdG8gJyArIHRvU3RhdGUudG8gKyAnLSBmaXJlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGJlZ2lucy4gdG9TdGF0ZSx0b1BhcmFtcyA6IFxcbicsIHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MgdG8gJyArIHRvU3RhdGUubmFtZSArICctIGZpcmVkIG9uY2UgdGhlIHN0YXRlIHRyYW5zaXRpb24gaXMgY29tcGxldGUuJyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyR2aWV3Q29udGVudExvYWRlZCAtIGZpcmVkIGFmdGVyIGRvbSByZW5kZXJlZCcsIGV2ZW50KTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH07XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRpZihzdGF0ZS5wYXJlbnQgPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdHN0YXRlLnBhcmVudCA9ICdhcHAtcm9vdCc7XHJcblxyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmNvbmZpZycsXHJcbiAgICAgICAgJ2FwcC5sYXlvdXQnLFxyXG4gICAgICAgICdhcHAubG9nZ2luZycsXHJcbiAgICAgICAgJ2FwcC5zZWN0aW9ucycsXHJcbiAgICAgICAgJ2FwcC5zZWN1cml0eScsXHJcbiAgICAgICAgJ2FwcC5kYXRhJyxcclxuICAgICAgICAnYXBwLnNvY2tldCcsXHJcbiAgICAgICAgJ3NvbG9tb24ucGFydGlhbHMnLFxyXG4gICAgICAgICdhcHAuZGFzaGJvYXJkJyxcclxuICAgICAgICAnYXBwLnN0b3JlcycsXHJcbiAgICAgICAgJ2FwcC50YXNrcycsXHJcbiAgICAgICAgJ2FwcC5jaGF0JyxcclxuICAgICAgICAnYXBwLmVtcGxveWVlcycsXHJcbiAgICAgICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAgICAgJ25nQW5pbWF0ZSdcclxuICAgIF0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uY29uZmlnKGNvbmZpZyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlnKGh0dHBDbGllbnRQcm92aWRlciwgJGh0dHBQcm92aWRlcil7XHJcblx0aHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5jYWNoZSA9IHRydWU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcblx0LmRpcmVjdGl2ZSgndWlTdGF0ZScsIHVpU3RhdGUpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHVpU3RhdGUoJHN0YXRlKSB7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0EnLFxyXG5cdFx0bGluazogbGluayxcclxuXHRcdHJlcXVpcmU6ICc/XnVpU3JlZkFjdGl2ZSdcclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3V0aWwnLCBVdGlsU2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBVdGlsU2VydmljZShldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRhZGRQcm9wZXJ0eTogYWRkUHJvcGVydHksXHJcblx0XHR1dWlkOiBnZW5lcmF0ZVVVSURcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gYWRkUHJvcGVydHkob2JqLCBuYW1lLCBnZXR0ZXIsIHNldHRlcikge1xyXG5cclxuXHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XHJcblx0XHRcdGdldDogZ2V0dGVyIHx8IGNyZWF0ZUdldHRlcihvYmosIG5hbWUpLFxyXG5cdFx0XHRzZXQ6IHNldHRlciB8fCBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIG9ialtmaWVsZF07XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHJcblx0XHRcdFx0dmFyIG9sZFZhbHVlID0gb2JqW2ZpZWxkXTtcclxuXHJcblx0XHRcdFx0b2JqW2ZpZWxkXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGV2ZW50U2VydmljZS5yYWlzZShuYW1lICsgJ0NoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRvYmo6IG9iaixcclxuXHRcdFx0XHRcdHByb3BlcnR5OiBuYW1lLFxyXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlLFxyXG5cdFx0XHRcdFx0b3JpZ2luYWxWYWx1ZTogb2xkVmFsdWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcclxuXHRcdHZhciBkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHR2YXIgdXVpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xyXG5cdFx0XHR2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcclxuXHRcdFx0ZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcclxuXHRcdFx0cmV0dXJuIChjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHV1aWQ7XHJcblx0fTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3N0b3JlU2VydmljZScsIFN0b3JlU2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSwgJHEpIHtcclxuXHJcblx0dmFyIF9jdXJyZW50U3RvcmU7XHJcblx0dmFyIF9jdXJyZW50T3JnO1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldE9yZ3M6IGdldE9yZ3MsXHJcblx0XHRnZXRTdG9yZXM6IGdldFN0b3JlcyxcclxuXHR9O1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnRPcmcnLCB7XHJcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0Z2V0OiBnZXRfY3VycmVudE9yZyxcclxuXHRcdHNldDogc2V0X2N1cnJlbnRPcmdcclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50U3RvcmUnLCB7XHJcblx0XHRnZXQ6IGdldF9jdXJyZW50U3RvcmUsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50U3RvcmVcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIGdldE9yZ3MoKSB7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9vcmdhbml6YXRpb25zJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFN0b3JlcyhvcmcpIHtcclxuXHJcblx0XHRpZighb3JnIHx8ICFvcmcuX2lkKVxyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucy8nICsgb3JnLl9pZCArICcvc3RvcmVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50T3JnKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50T3JnO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0X2N1cnJlbnRPcmcodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRPcmcgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRPcmcgPSB2YWx1ZTtcclxuXHRcdGV2ZW50U2VydmljZS5yYWlzZSgnb3JnQ2hhbmdlZCcsIF9jdXJyZW50T3JnKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50U3RvcmUoKSB7XHJcblx0XHRyZXR1cm4gX2N1cnJlbnRTdG9yZTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50U3RvcmUodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRTdG9yZSA9PT0gdmFsdWUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRfY3VycmVudFN0b3JlID0gdmFsdWU7XHJcblx0XHRldmVudFNlcnZpY2UucmFpc2UoJ3N0b3JlQ2hhbmdlZCcsIF9jdXJyZW50U3RvcmUpO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnLCBbJ2FwcC5kYXRhJ10pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICd0YXNrcycsXHJcblx0XHR1cmw6ICcvdGFza3MnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Rhc2tMaXN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90YXNrcy90YXNrbGlzdC5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDMsXHJcblx0XHRcdGljb246IFsnZ2x5cGhpY29uJywnZ2x5cGhpY29uLXRhZ3MnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycpXHJcblx0LmNvbnRyb2xsZXIoJ1Rhc2tMaXN0Q29udHJvbGxlcicsIFRhc2tMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gVGFza0xpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHRhc2tzOiBudWxsXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHRyZWZyZXNoVGFza3Moc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoVGFza3Moc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaFRhc2tzKHN0b3JlKSB7XHJcblxyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS50YXNrcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLnRhc2tzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJywgWyd1aS5yb3V0ZXInXSlcclxuLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnc3RvcmVzJyxcclxuICAgICAgICAgICAgdXJsOiAnL3N0b3JlcycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdG9yZXNDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9zdG9yZXMvc3RvcmVzLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDIsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tbWFwLW1hcmtlciddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnKVxyXG4uY29udHJvbGxlcignU3RvcmVzQ29udHJvbGxlcicsIFN0b3Jlc0NvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gU3RvcmVzQ29udHJvbGxlcihodHRwQ2xpZW50KXtcclxuXHRcclxuXHR2YXIgdm0gPSB0aGlzO1xyXG5cclxuXHR2bS5zdG9yZXMgPSBbXTtcclxuXHR2bS5zZWxlY3RlZCA9IG51bGw7XHJcblx0dm0udGFza3MgPSBbXTtcclxuXHJcblx0dm0uc2VsZWN0ID0gZnVuY3Rpb24oc3RvcmUpe1xyXG5cdFx0dm0uc2VsZWN0ZWQgPSBzdG9yZTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS50YXNrcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS5zdG9yZXMgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcsIFsndWkuYm9vdHN0cmFwJywgJ3VpLnJvdXRlciddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKFtcclxuXHJcbiAgICBdKTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbi5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBMb2dpbkNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvZ2luQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsICRzdGF0ZSl7XHJcblx0XHJcblx0dmFyIHZtID10aGlzO1xyXG5cdHZtLmxvZ2luID0ge1xyXG5cdFx0dXNlcm5hbWU6IFwiXCIsXHJcblx0XHRwYXNzd29yZDogXCJcIixcclxuXHRcdHJlbWVtYmVyTWU6IGZhbHNlXHJcblx0fTtcclxuXHJcblx0dGhpcy5idXN5ID0gZmFsc2U7XHJcblx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmJ1c3kgPSB0cnVlO1xyXG5cdFx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UubG9naW4odm0ubG9naW4udXNlcm5hbWUsIHZtLmxvZ2luLnBhc3N3b3JkLCB2bS5sb2dpbi5yZW1lbWJlck1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXQpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdFx0dm0ubWVzc2FnZSA9IChleC5kYXRhICYmIGV4LmRhdGEubWVzc2FnZSkgfHwgXCJVbmFibGUgdG8gbG9nIGluXCI7XHJcblxyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dm0uYnVzeSA9IGZhbHNlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0fTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycsIFsnYXBwLmRhdGEnXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRSb3V0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJvdXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2VtcGxveWVlcycsXHJcblx0XHR1cmw6ICcvZW1wbG95ZWVzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFbXBsb3llZXNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiA0LFxyXG5cdFx0XHRpY29uOiBbJ2ZhJywgJ2ZhLXVzZXJzJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJylcclxuXHQuY29udHJvbGxlcignRW1wbG95ZWVzQ29udHJvbGxlcicsIEVtcGxveWVlc0NvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEVtcGxveWVlc0NvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIGh0dHBDbGllbnQpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZW1wbG95ZWVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0Ly8gcmVmcmVzaEVtcGxveWVlcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hFbXBsb3llZXMoc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaEVtcGxveWVlcyhzdG9yZSkge1xyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS5lbXBsb3llZXMgPSBbXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvZW1wbG95ZWVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uZW1wbG95ZWVzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcsIFsnYXBwLnNlY3Rpb25zJ10pXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcbi8vLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG4vLyAgICAgICAgdXJsOiAnJyxcclxuLy8gICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4vLyAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+J1xyXG4vLyAgICB9KTtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbi8vICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcicsXHJcbi8vICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbi8vICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnXHJcbi8vICAgIH0pO1xyXG5cclxuLy99KTtcclxuXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnZGFzaGJvYXJkJyxcclxuICAgICAgICAgICAgdXJsOiAnLycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDEsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tc3RhdHMnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcsWydhcHAuc29ja2V0J10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGpvaW46IGpvaW4sXHJcblx0XHRsZWF2ZTogbGVhdmVcclxuXHR9XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGlkLCBtZXNzYWdlKSB7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvY2hhdC8nICsgaWQgKyAnL21lc3NhZ2VzJztcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCB7bWVzc2FnZTogbWVzc2FnZX0pXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGpvaW4oaWQpe1xyXG5cdFx0c29ja2V0LmVtaXQoJ2pvaW4nLCB7aWQ6IGlkfSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBsZWF2ZShpZCl7XHJcblx0XHRzb2NrZXQuZW1pdCgnbGVhdmUnLCB7aWQ6IGlkfSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbml0KCl7XHJcblx0XHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ2NoYXQtbWVzc2FnZScsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jaGF0JylcclxuLnJ1bihjb25maWd1cmVSb3V0ZXMpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcyhzZWN0aW9uTWFuYWdlcil7XHJcblx0c2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTdGF0ZXMoKXtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICdjaGF0LWxpc3QnLFxyXG5cdFx0dXJsOiAnL2NoYXRzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0LWxpc3QuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiA0LFxyXG5cdFx0XHRpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tY2xvdWQnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jaGF0JylcclxuXHQuY29udHJvbGxlcignQ2hhdExpc3RDb250cm9sbGVyJywgQ2hhdExpc3RDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0TGlzdENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBodHRwQ2xpZW50LCBldmVudFNlcnZpY2UsIGNoYXRTZXJ2aWNlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGNoYXRzOiBudWxsLFxyXG5cdFx0c2VuZE1lc3NhZ2U6IHNlbmRNZXNzYWdlLFxyXG5cdFx0am9pbjogam9pbixcclxuXHRcdGxlYXZlOiBsZWF2ZVxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGUsIG1zZyl7XHJcblxyXG5cdFx0dmFyIGNoYXQgPSBnZXRDaGF0KG1zZy5jaGF0KTtcclxuXHRcdGNoYXQubWVzc2FnZXMucHVzaCh7XHJcblx0XHRcdG1lc3NhZ2U6IG1zZy5tZXNzYWdlLFxyXG5cdFx0XHR0aW1lOiBtc2cudGltZSxcclxuXHRcdFx0dXNlcjogbXNnLnVzZXJcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHRmdW5jdGlvbiBvblN0b3JlQ2hhbmdlZChlLCBzdG9yZSkge1xyXG5cdFx0cmVmcmVzaENoYXRzKHN0b3JlKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hDaGF0cyhzdG9yZSkge1xyXG5cdFx0aWYgKCFzdG9yZSlcclxuXHRcdFx0cmV0dXJuIHZtLnRhc2tzID0gW107XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvY2hhdCcpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiB2bS5jaGF0cyA9IHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGpvaW4oY2hhdCl7XHJcblx0XHRjaGF0U2VydmljZS5qb2luKGNoYXQuX2lkKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGxlYXZlKGNoYXQpe1xyXG5cdFx0Y2hhdFNlcnZpY2UubGVhdmUoY2hhdC5faWQpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoY2hhdCwgbWVzc2FnZSkge1xyXG5cdFx0cmV0dXJuIGNoYXRTZXJ2aWNlLnNlbmRNZXNzYWdlKGNoYXQuX2lkLCBtZXNzYWdlKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihtc2cpIHtcclxuXHRcdFx0XHRjaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0bWVzc2FnZTogbXNnLm1lc3NhZ2UsXHJcblx0XHRcdFx0XHR0aW1lOiBtc2cudGltZSxcclxuXHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0c2VudDogdHJ1ZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGV4KTtcclxuXHRcdFx0fSkuZmluYWxseShmdW5jdGlvbigpe1xyXG5cdFx0XHRcdGNoYXQuY3VycmVudE1lc3NhZ2UgPSAnJztcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDaGF0KGlkKXtcclxuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCB2bS5jaGF0cy5sZW5ndGg7IGkrKyl7XHJcblx0XHRcdGlmKHZtLmNoYXRzW2ldLl9pZCA9PSBpZClcclxuXHRcdFx0XHRyZXR1cm4gdm0uY2hhdHNbaV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0FzaWRlQ29udHJvbGxlcicsIEFzaWRlQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQXNpZGVDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNlY3Rpb25zOiBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKClcclxuXHR9KTtcclxuXHJcblx0Ly92bS5zZWN0aW9ucyA9IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5jb250cm9sbGVyKCdTaGVsbENvbnRyb2xsZXInLCBTaGVsbENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFNoZWxsQ29udHJvbGxlcihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIC8vdmFyIHZtID0gdGhpcztcclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29uZmlnKGluaXRpYWxpemVTdGF0ZXMpXHJcblx0LnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgc2VjdXJpdHlTZXJ2aWNlLCAkdGltZW91dCkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHRpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdXNlciA9IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpO1xyXG5cdFx0aWYgKHVzZXIpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1KSB7XHJcblxyXG5cdFx0XHRcdHZhciB0YXJnZXRTdGF0ZSA9IHUgPyB0b1N0YXRlIDogJ2xvZ2luJztcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKHRhcmdldFN0YXRlKTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgd2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcblx0XHRcclxuXHRcdGlmKCEkcm9vdFNjb3BlLnNob3dTcGxhc2gpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR3YWl0aW5nRm9yVmlldyA9IHRydWU7XHJcblx0fSk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbihlKSB7XHJcblxyXG5cclxuXHRcdGlmICh3YWl0aW5nRm9yVmlldyAmJiAkcm9vdFNjb3BlLnNob3dTcGxhc2gpIHtcclxuXHRcdFx0d2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdnaXZlIHRpbWUgdG8gcmVuZGVyJyk7XHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzaG93U3BsYXNoID0gZmFsc2UnKTtcclxuXHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHRcdFx0fSwgMTApO1xyXG5cclxuXHRcdH1cclxuXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdFx0dXJsOiAnJyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PicsXHJcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5zaG93U3BsYXNoID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly8gQG5nSW5qZWN0XHJcblx0XHRcdFx0dXNlcjogZnVuY3Rpb24oc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogLyogQG5nSW5qZWN0ICovIGZ1bmN0aW9uKCRzdGF0ZSwgdXNlcikge1xyXG5cdFx0XHRcdC8vIGlmKHVzZXIpXHJcblx0XHRcdFx0Ly8gICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0XHQvLyB1cmw6ICcnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiBcInZtXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xvZ2luL2xvZ2luLmh0bWwnXHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuXHRcdFx0Ly91cmw6ICcnLFxyXG5cdFx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvL3VzZXI6IGZ1bmN0aW9uKClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb250cm9sbGVyKCdIZWFkZXJDb250cm9sbGVyJywgSGVhZGVyQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsIHN0b3JlU2VydmljZSwgZXZlbnRTZXJ2aWNlLCB1dGlsKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdG1lc3NhZ2U6IFwiSGVsbG8gSGVhZGVyXCIsXHJcblx0XHR1c2VyOiBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIsXHJcblx0XHRvcmdzOiBbXSxcclxuXHRcdHN0b3JlczogW11cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnb3JnJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudE9yZzt9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSl7c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwgJ3N0b3JlJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlID0gdmFsdWU7fVxyXG5cdH0pO1xyXG5cclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdvcmcnKTtcclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdzdG9yZScpO1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRcdHZtLnVzZXIgPSB4O1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2Uub24oJ3VzZXJDaGFuZ2VkJywgaGFuZGxlVXNlckNoYW5nZWQpO1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRPcmdzKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKG9yZ3Mpe1xyXG5cdFx0XHR2bS5vcmdzID0gb3JncztcclxuXHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2bS5vcmdzWzBdO1xyXG5cdFx0XHRyZWZyZXNoU3RvcmVzKHZtLm9yZ3NbMF0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZXZlbnRTZXJ2aWNlLm9uKCdvcmdDaGFuZ2VkJywgZnVuY3Rpb24oZSwgb3JnKXtcclxuXHRcdFx0Ly92bS5vcmcgPSBvcmc7XHJcblx0XHRcdHJlZnJlc2hTdG9yZXMob3JnKTtcclxuXHRcdFx0XHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoU3RvcmVzKG9yZyl7XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldFN0b3JlcyhvcmcpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3Jlcyl7XHJcblx0XHRcdFx0dm0uc3RvcmVzID0gc3RvcmVzO1xyXG5cdFx0XHRcdHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgPSB2bS5zdG9yZXNbMF07XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlVXNlckNoYW5nZWQodXNlcikge1xyXG5cdFx0dm0udXNlciA9IHVzZXI7XHJcblx0fVxyXG59IiwiKGZ1bmN0aW9uICgpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxufSgpKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbmZpZycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbmZpZycpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9