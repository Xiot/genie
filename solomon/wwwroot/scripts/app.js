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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJjb21tb24vZGF0YS9kYXRhLm1vZHVsZS5qcyIsImNvbW1vbi9kYXRhL3V0aWwuanMiLCJjb21tb24vZGF0YS9zdG9yZVNlcnZpY2UuanMiLCJhcmVhcy90YXNrcy90YXNrcy5tb2R1bGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5yb3V0ZXMuanMiLCJhcmVhcy90YXNrcy90YXNrbGlzdC5jb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5jb250cm9sbGVyLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMubW9kdWxlLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5yb3V0ZXMuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvc29ja2V0QnVpbGRlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5tb2R1bGUuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5yb3V0ZXMuanMiLCJhcmVhcy9jaGF0L2NoYXQuY29udHJvbGxlci5qcyIsImFyZWFzL2FzaWRlL2FzaWRlLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwibGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIiwiY29uZmlnL2NvbmZpZy5tb2R1bGUuanMiLCJlbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsInNvY2tldEZhY3RvcnkiLCJlbnYiLCJzdG9yYWdlU2VydmljZSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJkZXZpY2UiLCJnZXQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwiYXBpUm9vdCIsInF1ZXJ5IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJzZWN1cml0eVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJfbGlzdGVuZXJzIiwic2VydmljZSIsImN1cnJlbnRVc2VyIiwicmVxdWVzdEN1cnJlbnRVc2VyIiwiX3JlcXVlc3RDdXJyZW50VXNlciIsIm9uIiwiYWRkTGlzdGVuZXIiLCJsb2dpbiIsIl9sb2dpbiIsImxvZ291dCIsIl9sb2dvdXQiLCJldmVudE5hbWUiLCJsaXN0ZW5lciIsInB1c2giLCJmaXJlRXZlbnQiLCJhcmdzIiwiaGFuZGxlciIsImV2ZW50QXJncyIsInNwbGljZSIsImNhbGwiLCJmb3JFYWNoIiwiY2IiLCJ0b2tlbiIsIndoZW4iLCJvcHRpb25zIiwiY2FjaGUiLCJhdXRoIiwiZGVmZXIiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwicmVzb2x2ZSIsImNhdGNoIiwicmVzIiwic3RhdHVzIiwicmVqZWN0IiwicHJvbWlzZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJwZXJzaXN0IiwidGV4dCIsImJ0b2EiLCJwb3N0IiwiYXV0aF90b2tlbiIsInVzZXIiLCJzZXQiLCJyZW1vdmUiLCJnbyIsIl9zZXRVc2VyIiwicnVuIiwiZGVidWdSb3V0ZXMiLCIkcm9vdFNjb3BlIiwiJHN0YXRlUGFyYW1zIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJmcm9tU3RhdGUiLCJmcm9tUGFyYW1zIiwiY29uc29sZSIsImxvZyIsImFyZ3VtZW50cyIsInVuZm91bmRTdGF0ZSIsInRvIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsImdldFNlY3Rpb25zIiwicmVnaXN0ZXIiLCJyZWdpc3RlclNlY3Rpb25zIiwiZ2V0TW9kdWxlcyIsInNlY3Rpb25zIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJ4Iiwic2V0dGluZ3MiLCJsb2dnZXJTZXJ2aWNlIiwiJGxvZyIsImluZm8iLCJ3YXJuaW5nIiwiZXJyb3IiLCJtZXNzYWdlIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsImJhc2VVcmkiLCJkZWZhdWx0cyIsInVzZVhEb21haW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJkaXJlY3RpdmUiLCJ1aVN0YXRlIiwicmVzdHJpY3QiLCJsaW5rIiwicmVxdWlyZSIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwidWlTcmVmQWN0aXZlIiwibmFtZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiVXRpbFNlcnZpY2UiLCJldmVudFNlcnZpY2UiLCJhZGRQcm9wZXJ0eSIsInV1aWQiLCJnZW5lcmF0ZVVVSUQiLCJvYmoiLCJnZXR0ZXIiLCJzZXR0ZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImNyZWF0ZUdldHRlciIsImNyZWF0ZVNldHRlciIsImZpZWxkIiwidmFsdWUiLCJvbGRWYWx1ZSIsInJhaXNlIiwicHJvcGVydHkiLCJvcmlnaW5hbFZhbHVlIiwiZCIsIkRhdGUiLCJnZXRUaW1lIiwicmVwbGFjZSIsImMiLCJyIiwiTWF0aCIsInJhbmRvbSIsImZsb29yIiwidG9TdHJpbmciLCJTdG9yZVNlcnZpY2UiLCJfY3VycmVudFN0b3JlIiwiX2N1cnJlbnRPcmciLCJnZXRPcmdzIiwiZ2V0U3RvcmVzIiwiZW51bWVyYWJsZSIsImdldF9jdXJyZW50T3JnIiwic2V0X2N1cnJlbnRPcmciLCJnZXRfY3VycmVudFN0b3JlIiwic2V0X2N1cnJlbnRTdG9yZSIsIm9yZyIsIl9pZCIsImFwcFJ1biIsInNlY3Rpb25NYW5hZ2VyIiwiZ2V0U3RhdGVzIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwib3JkZXIiLCJpY29uIiwiVGFza0xpc3RDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwidm0iLCJ0YXNrcyIsIm9uU3RvcmVDaGFuZ2VkIiwicmVmcmVzaFRhc2tzIiwiY3VycmVudFN0b3JlIiwiZSIsInN0b3JlIiwiaWQiLCJMb2dpbkNvbnRyb2xsZXIiLCJyZW1lbWJlck1lIiwiYnVzeSIsInJldCIsImV4IiwiZmluYWxseSIsIlN0b3Jlc0NvbnRyb2xsZXIiLCJzdG9yZXMiLCJzZWxlY3RlZCIsInNlbGVjdCIsImluaXQiLCJjb25maWd1cmVSb3V0ZXMiLCJnZXRSb3V0ZXMiLCJFbXBsb3llZXNDb250cm9sbGVyIiwiZW1wbG95ZWVzIiwicmVmcmVzaEVtcGxveWVlcyIsIkRhc2hib2FyZENvbnRyb2xsZXIiLCJDaGF0RmFjdG9yeSIsInNvY2tldCIsInNlbmRNZXNzYWdlIiwiam9pbiIsImxlYXZlIiwiZW1pdCIsIiRlbWl0IiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdFNlcnZpY2UiLCJjaGF0cyIsIm1zZyIsImNoYXQiLCJnZXRDaGF0IiwibWVzc2FnZXMiLCJ0aW1lIiwicmVmcmVzaENoYXRzIiwiY3VycmVudE1lc3NhZ2UiLCJpIiwibGVuZ3RoIiwiQXNpZGVDb250cm9sbGVyIiwiU2hlbGxDb250cm9sbGVyIiwiaW5pdGlhbGl6ZVN0YXRlcyIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsInNob3dTcGxhc2giLCJwcmV2ZW50RGVmYXVsdCIsInUiLCJ0YXJnZXRTdGF0ZSIsIndhaXRpbmdGb3JWaWV3IiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwiYWJzdHJhY3QiLCJ0ZW1wbGF0ZSIsIiRzY29wZSIsIm9uRW50ZXIiLCJIZWFkZXJDb250cm9sbGVyIiwidXRpbCIsIm9yZ3MiLCJjdXJyZW50T3JnIiwiaGFuZGxlVXNlckNoYW5nZWQiLCJyZWZyZXNoU3RvcmVzIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBREpBLFFBQVFDLE9BQU8sY0FBYTtRQUMzQjtRQUNBOztLQUlJO0FDTkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxjQUNWQyxRQUFRLDREQUFpQixVQUFVQyxlQUFlQyxLQUFLQyxnQkFBZ0I7UUFFcEUsSUFBSUMsVUFBVSxVQUFVQyxXQUFXO1lBRS9CQSxZQUFZQSxhQUFhO1lBRXpCLElBQUlDLFNBQVNILGVBQWVJLElBQUk7OztZQUtoQyxJQUFJQyxhQUFhQyxHQUFHQyxRQUFRUixJQUFJUyxVQUFVTixXQUFXLEVBQ2pETyxPQUFPLFlBQVlOO1lBR3ZCLElBQUlPLFdBQVdaLGNBQWMsRUFDekJhLFVBQVVOO1lBR2QsT0FBT0s7O1FBR1gsT0FBT1Q7UUFJVkosUUFBUSw0QkFBVSxVQUFTZSxlQUFjO1FBQ3RDLE9BQU9BOztLQVpWO0FDaEJMLENBQUMsWUFBWTtJQUNUO0lBREpqQixRQUFRQyxPQUFPLGdCQUFnQixJQUMxQkMs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WUFDaEMwSCxHQUFHMUgsT0FBT0E7Ozs7S0FMUDtBQ3ZETCxDQUFDLFlBQVk7SUFDVDtLQUNDO0FDRkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5FLFFBQVFDLE9BQU8sY0FBYztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDZDhQLFNBQVMsT0FBTyxFQUNibFAsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc29ja2V0JyxbXHJcblx0J2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cdCdzeW1iaW90ZS5jb21tb24nXHJcblx0XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52LCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZS1pZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyB1bmRlZmluZWQgdGhlbiBnZW5lcmF0ZSBhIG5ldyBkZXZpY2Uga2V5XHJcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBzZXBlcmF0ZWQgaW50byBhIGRpZmZlcmVudCBzZXJ2aWNlLlxyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpe1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN1cml0eScsIFtdKVxyXG4gICAgLmZhY3RvcnkoJ3NlY3VyaXR5U2VydmljZScsIHNlY3VyaXR5U2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdXJpdHlTZXJ2aWNlKHN0b3JhZ2VTZXJ2aWNlLCAkc3RhdGUsIGh0dHBDbGllbnQsICRxKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50VXNlciA9IG51bGw7XHJcbiAgICB2YXIgX2xpc3RlbmVycyA9IHt9O1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGN1cnJlbnRVc2VyOiBmdW5jdGlvbigpe3JldHVybiBfY3VycmVudFVzZXI7fSxcclxuICAgICAgICByZXF1ZXN0Q3VycmVudFVzZXI6IF9yZXF1ZXN0Q3VycmVudFVzZXIsXHJcblxyXG4gICAgICAgIG9uOiBhZGRMaXN0ZW5lcixcclxuXHJcbiAgICAgICAgbG9naW46IF9sb2dpbixcclxuICAgICAgICBsb2dvdXQ6IF9sb2dvdXRcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcil7XHJcbiAgICAgICAgaWYoIV9saXN0ZW5lcnNbZXZlbnROYW1lXSlcclxuICAgICAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZmlyZUV2ZW50KGV2ZW50TmFtZSwgYXJncyl7XHJcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBfbGlzdGVuZXJzW2V2ZW50TmFtZV07XHJcbiAgICAgICAgaWYoIWhhbmRsZXIpIFxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBldmVudEFyZ3MgPSBbXS5zcGxpY2UuY2FsbChhcmdzLCAxKTtcclxuICAgICAgICBoYW5kbGVyLmZvckVhY2goZnVuY3Rpb24oY2Ipe1xyXG4gICAgICAgICAgICBjYihldmVudEFyZ3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pIHtcclxuXHJcbiAgICAgICAgaWYgKF9jdXJyZW50VXNlcilcclxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oX2N1cnJlbnRVc2VyKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0b2tlbilcclxuICAgICAgICAgICAgb3B0aW9ucy5hdXRoID0ge1xyXG4gICAgICAgICAgICAgICAgJ0JlYXJlcic6IHRva2VuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgICAgIGh0dHBDbGllbnQuZ2V0KCcvdG9rZW5zL2N1cnJlbnQnLCBvcHRpb25zKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIF9jdXJyZW50VXNlciA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkLCBwZXJzaXN0KSB7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0ID0gYnRvYSh1c2VybmFtZSArIFwiOlwiICsgcGFzc3dvcmQpO1xyXG4gICAgICAgIHZhciB0b2tlbiA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiBodHRwQ2xpZW50LnBvc3QoJy90b2tlbnMnLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ0Jhc2ljJzogdGV4dFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRva2VuID0gcmVzLmRhdGEuYXV0aF90b2tlbjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbik7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZVNlcnZpY2Uuc2V0KFwiYXV0aC10b2tlblwiLCB0b2tlbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ291dCgpIHtcclxuICAgICAgICBzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3Rva2VuJyk7XHJcbiAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9zZXRVc2VyKHVzZXIpe1xyXG4gICAgICAgIF9jdXJyZW50VXNlciA9IHVzZXI7XHJcbiAgICAgICAgZmlyZUV2ZW50KCd1c2VyQ2hhbmdlZCcsIHVzZXIpO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpLnJ1bihkZWJ1Z1JvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZGVidWdSb3V0ZXMoJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgIC8vIENyZWRpdHM6IEFkYW0ncyBhbnN3ZXIgaW4gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3ODYyNjIvNjkzNjJcclxuICAgIC8vIFBhc3RlIHRoaXMgaW4gYnJvd3NlcidzIGNvbnNvbGVcclxuXHJcbiAgICAvL3ZhciAkcm9vdFNjb3BlID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdWktdmlld11cIilbMF0pLmluamVjdG9yKCkuZ2V0KCckcm9vdFNjb3BlJyk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlTm90Rm91bmQgJyArIHVuZm91bmRTdGF0ZS50byArICcgIC0gZmlyZWQgd2hlbiBhIHN0YXRlIGNhbm5vdCBiZSBmb3VuZCBieSBpdHMgbmFtZS4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3RhcnQgdG8gJyArIHRvU3RhdGUudG8gKyAnLSBmaXJlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGJlZ2lucy4gdG9TdGF0ZSx0b1BhcmFtcyA6IFxcbicsIHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MgdG8gJyArIHRvU3RhdGUubmFtZSArICctIGZpcmVkIG9uY2UgdGhlIHN0YXRlIHRyYW5zaXRpb24gaXMgY29tcGxldGUuJyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyR2aWV3Q29udGVudExvYWRlZCAtIGZpcmVkIGFmdGVyIGRvbSByZW5kZXJlZCcsIGV2ZW50KTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH07XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRpZihzdGF0ZS5wYXJlbnQgPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdHN0YXRlLnBhcmVudCA9ICdhcHAtcm9vdCc7XHJcblxyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmNvbmZpZycsXHJcbiAgICAgICAgJ2FwcC5sYXlvdXQnLFxyXG4gICAgICAgICdhcHAubG9nZ2luZycsXHJcbiAgICAgICAgJ2FwcC5zZWN0aW9ucycsXHJcbiAgICAgICAgJ2FwcC5zZWN1cml0eScsXHJcbiAgICAgICAgJ2FwcC5kYXRhJyxcclxuICAgICAgICAnYXBwLnNvY2tldCcsXHJcbiAgICAgICAgJ3NvbG9tb24ucGFydGlhbHMnLFxyXG4gICAgICAgICdhcHAuZGFzaGJvYXJkJyxcclxuICAgICAgICAnYXBwLnN0b3JlcycsXHJcbiAgICAgICAgJ2FwcC50YXNrcycsXHJcbiAgICAgICAgJ2FwcC5jaGF0JyxcclxuICAgICAgICAnYXBwLmVtcGxveWVlcycsXHJcbiAgICAgICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAgICAgJ25nQW5pbWF0ZSdcclxuICAgIF0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uY29uZmlnKGNvbmZpZyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlnKGh0dHBDbGllbnRQcm92aWRlciwgJGh0dHBQcm92aWRlcil7XHJcblx0aHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5jYWNoZSA9IHRydWU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcblx0LmRpcmVjdGl2ZSgndWlTdGF0ZScsIHVpU3RhdGUpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHVpU3RhdGUoJHN0YXRlKSB7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0EnLFxyXG5cdFx0bGluazogbGluayxcclxuXHRcdHJlcXVpcmU6ICc/XnVpU3JlZkFjdGl2ZSdcclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3V0aWwnLCBVdGlsU2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBVdGlsU2VydmljZShldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRhZGRQcm9wZXJ0eTogYWRkUHJvcGVydHksXHJcblx0XHR1dWlkOiBnZW5lcmF0ZVVVSURcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gYWRkUHJvcGVydHkob2JqLCBuYW1lLCBnZXR0ZXIsIHNldHRlcikge1xyXG5cclxuXHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XHJcblx0XHRcdGdldDogZ2V0dGVyIHx8IGNyZWF0ZUdldHRlcihvYmosIG5hbWUpLFxyXG5cdFx0XHRzZXQ6IHNldHRlciB8fCBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIG9ialtmaWVsZF07XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHJcblx0XHRcdFx0dmFyIG9sZFZhbHVlID0gb2JqW2ZpZWxkXTtcclxuXHJcblx0XHRcdFx0b2JqW2ZpZWxkXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGV2ZW50U2VydmljZS5yYWlzZShuYW1lICsgJ0NoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRvYmo6IG9iaixcclxuXHRcdFx0XHRcdHByb3BlcnR5OiBuYW1lLFxyXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlLFxyXG5cdFx0XHRcdFx0b3JpZ2luYWxWYWx1ZTogb2xkVmFsdWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcclxuXHRcdHZhciBkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHR2YXIgdXVpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xyXG5cdFx0XHR2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcclxuXHRcdFx0ZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcclxuXHRcdFx0cmV0dXJuIChjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHV1aWQ7XHJcblx0fTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3N0b3JlU2VydmljZScsIFN0b3JlU2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSwgJHEpIHtcclxuXHJcblx0dmFyIF9jdXJyZW50U3RvcmU7XHJcblx0dmFyIF9jdXJyZW50T3JnO1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldE9yZ3M6IGdldE9yZ3MsXHJcblx0XHRnZXRTdG9yZXM6IGdldFN0b3JlcyxcclxuXHR9O1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnRPcmcnLCB7XHJcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0Z2V0OiBnZXRfY3VycmVudE9yZyxcclxuXHRcdHNldDogc2V0X2N1cnJlbnRPcmdcclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50U3RvcmUnLCB7XHJcblx0XHRnZXQ6IGdldF9jdXJyZW50U3RvcmUsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50U3RvcmVcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIGdldE9yZ3MoKSB7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9vcmdhbml6YXRpb25zJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFN0b3JlcyhvcmcpIHtcclxuXHJcblx0XHRpZighb3JnIHx8ICFvcmcuX2lkKVxyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucy8nICsgb3JnLl9pZCArICcvc3RvcmVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50T3JnKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50T3JnO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0X2N1cnJlbnRPcmcodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRPcmcgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRPcmcgPSB2YWx1ZTtcclxuXHRcdGV2ZW50U2VydmljZS5yYWlzZSgnb3JnQ2hhbmdlZCcsIF9jdXJyZW50T3JnKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50U3RvcmUoKSB7XHJcblx0XHRyZXR1cm4gX2N1cnJlbnRTdG9yZTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50U3RvcmUodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRTdG9yZSA9PT0gdmFsdWUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRfY3VycmVudFN0b3JlID0gdmFsdWU7XHJcblx0XHRldmVudFNlcnZpY2UucmFpc2UoJ3N0b3JlQ2hhbmdlZCcsIF9jdXJyZW50U3RvcmUpO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnLCBbJ2FwcC5kYXRhJ10pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICd0YXNrcycsXHJcblx0XHR1cmw6ICcvdGFza3MnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Rhc2tMaXN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90YXNrcy90YXNrbGlzdC5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDMsXHJcblx0XHRcdGljb246IFsnZ2x5cGhpY29uJywnZ2x5cGhpY29uLXRhZ3MnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycpXHJcblx0LmNvbnRyb2xsZXIoJ1Rhc2tMaXN0Q29udHJvbGxlcicsIFRhc2tMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gVGFza0xpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHRhc2tzOiBudWxsXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHRyZWZyZXNoVGFza3Moc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoVGFza3Moc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaFRhc2tzKHN0b3JlKSB7XHJcblxyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS50YXNrcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLnRhc2tzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JywgWyd1aS5ib290c3RyYXAnLCAndWkucm91dGVyJ10pOyAiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoW1xyXG5cclxuICAgIF0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIExvZ2luQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gTG9naW5Db250cm9sbGVyKHNlY3VyaXR5U2VydmljZSwgJHN0YXRlKXtcclxuXHRcclxuXHR2YXIgdm0gPXRoaXM7XHJcblx0dm0ubG9naW4gPSB7XHJcblx0XHR1c2VybmFtZTogXCJcIixcclxuXHRcdHBhc3N3b3JkOiBcIlwiLFxyXG5cdFx0cmVtZW1iZXJNZTogZmFsc2VcclxuXHR9O1xyXG5cclxuXHR0aGlzLmJ1c3kgPSBmYWxzZTtcclxuXHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHR0aGlzLmxvZ2luID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYnVzeSA9IHRydWU7XHJcblx0XHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5sb2dpbih2bS5sb2dpbi51c2VybmFtZSwgdm0ubG9naW4ucGFzc3dvcmQsIHZtLmxvZ2luLnJlbWVtYmVyTWUpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcclxuXHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KXtcclxuXHRcdFx0XHR2bS5tZXNzYWdlID0gKGV4LmRhdGEgJiYgZXguZGF0YS5tZXNzYWdlKSB8fCBcIlVuYWJsZSB0byBsb2cgaW5cIjtcclxuXHJcblx0XHRcdH0pLmZpbmFsbHkoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2bS5idXN5ID0gZmFsc2U7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9O1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJywgWyd1aS5yb3V0ZXInXSlcclxuLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnc3RvcmVzJyxcclxuICAgICAgICAgICAgdXJsOiAnL3N0b3JlcycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTdG9yZXNDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9zdG9yZXMvc3RvcmVzLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDIsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tbWFwLW1hcmtlciddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnKVxyXG4uY29udHJvbGxlcignU3RvcmVzQ29udHJvbGxlcicsIFN0b3Jlc0NvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gU3RvcmVzQ29udHJvbGxlcihodHRwQ2xpZW50KXtcclxuXHRcclxuXHR2YXIgdm0gPSB0aGlzO1xyXG5cclxuXHR2bS5zdG9yZXMgPSBbXTtcclxuXHR2bS5zZWxlY3RlZCA9IG51bGw7XHJcblx0dm0udGFza3MgPSBbXTtcclxuXHJcblx0dm0uc2VsZWN0ID0gZnVuY3Rpb24oc3RvcmUpe1xyXG5cdFx0dm0uc2VsZWN0ZWQgPSBzdG9yZTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS50YXNrcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHgpe1xyXG5cdFx0XHR2bS5zdG9yZXMgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycsIFsnYXBwLmRhdGEnXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRSb3V0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJvdXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2VtcGxveWVlcycsXHJcblx0XHR1cmw6ICcvZW1wbG95ZWVzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFbXBsb3llZXNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiA0LFxyXG5cdFx0XHRpY29uOiBbJ2ZhJywgJ2ZhLXVzZXJzJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJylcclxuXHQuY29udHJvbGxlcignRW1wbG95ZWVzQ29udHJvbGxlcicsIEVtcGxveWVlc0NvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEVtcGxveWVlc0NvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIGh0dHBDbGllbnQpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZW1wbG95ZWVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0Ly8gcmVmcmVzaEVtcGxveWVlcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hFbXBsb3llZXMoc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaEVtcGxveWVlcyhzdG9yZSkge1xyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS5lbXBsb3llZXMgPSBbXTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvZW1wbG95ZWVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uZW1wbG95ZWVzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcsIFsnYXBwLnNlY3Rpb25zJ10pXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcbi8vLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG4vLyAgICAgICAgdXJsOiAnJyxcclxuLy8gICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4vLyAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+J1xyXG4vLyAgICB9KTtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbi8vICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcicsXHJcbi8vICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbi8vICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnXHJcbi8vICAgIH0pO1xyXG5cclxuLy99KTtcclxuXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnZGFzaGJvYXJkJyxcclxuICAgICAgICAgICAgdXJsOiAnLycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDEsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tc3RhdHMnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcsWydhcHAuc29ja2V0J10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGpvaW46IGpvaW4sXHJcblx0XHRsZWF2ZTogbGVhdmVcclxuXHR9XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGlkLCBtZXNzYWdlKSB7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvY2hhdC8nICsgaWQgKyAnL21lc3NhZ2VzJztcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCB7bWVzc2FnZTogbWVzc2FnZX0se30pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBqb2luKGlkKXtcclxuXHRcdHNvY2tldC5lbWl0KCdqb2luJywge2lkOiBpZH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbGVhdmUoaWQpe1xyXG5cdFx0c29ja2V0LmVtaXQoJ2xlYXZlJywge2lkOiBpZH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcbi5ydW4oY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoc2VjdGlvbk1hbmFnZXIpe1xyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCl7XHJcblx0cmV0dXJuIFt7XHJcblx0XHRuYW1lOiAnY2hhdC1saXN0JyxcclxuXHRcdHVybDogJy9jaGF0cycsXHJcblx0XHRjb250cm9sbGVyOiAnQ2hhdExpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdC1saXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogNCxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCAnZ2x5cGhpY29uLWNsb3VkJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmNvbnRyb2xsZXIoJ0NoYXRMaXN0Q29udHJvbGxlcicsIENoYXRMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdExpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlLCBjaGF0U2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRjaGF0czogbnVsbCxcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGpvaW46IGpvaW4sXHJcblx0XHRsZWF2ZTogbGVhdmVcclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpe1xyXG5cclxuXHRcdHZhciBjaGF0ID0gZ2V0Q2hhdChtc2cuY2hhdCk7XHJcblx0XHRjaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdHVzZXI6IG1zZy51c2VyXHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hDaGF0cyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoQ2hhdHMoc3RvcmUpIHtcclxuXHRcdGlmICghc3RvcmUpXHJcblx0XHRcdHJldHVybiB2bS50YXNrcyA9IFtdO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL2NoYXQnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gdm0uY2hhdHMgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBqb2luKGNoYXQpe1xyXG5cdFx0Y2hhdFNlcnZpY2Uuam9pbihjaGF0Ll9pZCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBsZWF2ZShjaGF0KXtcclxuXHRcdGNoYXRTZXJ2aWNlLmxlYXZlKGNoYXQuX2lkKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGNoYXQsIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0Ll9pZCwgbWVzc2FnZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Ly8gY2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHQvLyBcdG1lc3NhZ2U6IG1lc3NhZ2UsXHJcblx0XHRcdFx0Ly8gXHRzZW50OiB0cnVlXHJcblx0XHRcdFx0Ly8gfSk7XHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXgpO1xyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2hhdC5jdXJyZW50TWVzc2FnZSA9ICcnO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldENoYXQoaWQpe1xyXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IHZtLmNoYXRzLmxlbmd0aDsgaSsrKXtcclxuXHRcdFx0aWYodm0uY2hhdHNbaV0uX2lkID09IGlkKVxyXG5cdFx0XHRcdHJldHVybiB2bS5jaGF0c1tpXTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29udHJvbGxlcignQXNpZGVDb250cm9sbGVyJywgQXNpZGVDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBBc2lkZUNvbnRyb2xsZXIoc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0c2VjdGlvbnM6IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKVxyXG5cdH0pO1xyXG5cclxuXHQvL3ZtLnNlY3Rpb25zID0gc2VjdGlvbk1hbmFnZXIuZ2V0TW9kdWxlcygpO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLmNvbnRyb2xsZXIoJ1NoZWxsQ29udHJvbGxlcicsIFNoZWxsQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU2hlbGxDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgLy92YXIgdm0gPSB0aGlzO1xyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb25maWcoaW5pdGlhbGl6ZVN0YXRlcylcclxuXHQucnVuKGVuc3VyZUF1dGhlbnRpY2F0ZWQpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGVuc3VyZUF1dGhlbnRpY2F0ZWQoJHJvb3RTY29wZSwgJHN0YXRlLCBzZWN1cml0eVNlcnZpY2UsICR0aW1lb3V0KSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB1c2VyID0gc2VjdXJpdHlTZXJ2aWNlLmN1cnJlbnRVc2VyKCk7XHJcblx0XHRpZiAodXNlcikge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcblx0XHRcdFx0dmFyIHRhcmdldFN0YXRlID0gdSA/IHRvU3RhdGUgOiAnbG9naW4nO1xyXG5cclxuXHRcdFx0XHQkc3RhdGUuZ28odGFyZ2V0U3RhdGUpO1xyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHZhciB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHRcdFxyXG5cdFx0aWYoISRyb290U2NvcGUuc2hvd1NwbGFzaClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHdhaXRpbmdGb3JWaWV3ID0gdHJ1ZTtcclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcclxuXHJcblxyXG5cdFx0aWYgKHdhaXRpbmdGb3JWaWV3ICYmICRyb290U2NvcGUuc2hvd1NwbGFzaCkge1xyXG5cdFx0XHR3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3Nob3dTcGxhc2ggPSBmYWxzZScpO1xyXG5cdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHR9LCAxMCk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufVxyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGluaXRpYWxpemVTdGF0ZXMoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG5cclxuXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG5cclxuXHQkc3RhdGVQcm92aWRlclxyXG5cdFx0LnN0YXRlKCdyb290Jywge1xyXG5cdFx0XHR1cmw6ICcnLFxyXG5cdFx0XHRhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdFx0dGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+JyxcclxuXHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG5cdFx0XHRcdGlmICgkcm9vdFNjb3BlLnNob3dTcGxhc2ggPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblx0XHRcdH0sXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvLyBAbmdJbmplY3RcclxuXHRcdFx0XHR1c2VyOiBmdW5jdGlvbihzZWN1cml0eVNlcnZpY2UpIHtcclxuXHRcdFx0XHRcdHJldHVybiBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkVudGVyOiAvKiBAbmdJbmplY3QgKi8gZnVuY3Rpb24oJHN0YXRlLCB1c2VyKSB7XHJcblx0XHRcdFx0Ly8gaWYodXNlcilcclxuXHRcdFx0XHQvLyAgICAgcmV0dXJuICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHRcdC8vICRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcdC5zdGF0ZSgnbG9naW4nLCB7XHJcblx0XHRcdC8vIHVybDogJycsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdMb2dpbkNvbnRyb2xsZXInLFxyXG5cdFx0XHRjb250cm9sbGVyQXM6IFwidm1cIixcclxuXHRcdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbG9naW4vbG9naW4uaHRtbCdcclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2FwcC1yb290Jywge1xyXG5cdFx0XHQvL3VybDogJycsXHJcblx0XHRcdHBhcmVudDogJ3Jvb3QnLFxyXG5cdFx0XHRhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdFx0Y29udHJvbGxlcjogJ1NoZWxsQ29udHJvbGxlcicsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2xheW91dC9zaGVsbC5odG1sJyxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdC8vdXNlcjogZnVuY3Rpb24oKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRvbkVudGVyOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnU2hlbGxDb250cm9sbGVyLm9uRW50ZXInKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0hlYWRlckNvbnRyb2xsZXInLCBIZWFkZXJDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBIZWFkZXJDb250cm9sbGVyKHNlY3VyaXR5U2VydmljZSwgc3RvcmVTZXJ2aWNlLCBldmVudFNlcnZpY2UsIHV0aWwpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0bWVzc2FnZTogXCJIZWxsbyBIZWFkZXJcIixcclxuXHRcdHVzZXI6IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcixcclxuXHRcdG9yZ3M6IFtdLFxyXG5cdFx0c3RvcmVzOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkodm0sICdvcmcnLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHN0b3JlU2VydmljZS5jdXJyZW50T3JnO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudE9yZyA9IHZhbHVlO31cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnc3RvcmUnLCB7XHJcblx0XHRnZXQ6IGZ1bmN0aW9uKCl7cmV0dXJuIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmU7fSxcclxuXHRcdHNldDogZnVuY3Rpb24odmFsdWUpe3N0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdC8vdXRpbC5hZGRQcm9wZXJ0eSh2bSwgJ29yZycpO1xyXG5cdC8vdXRpbC5hZGRQcm9wZXJ0eSh2bSwgJ3N0b3JlJyk7XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpIHtcclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih4KSB7XHJcblx0XHRcdFx0dm0udXNlciA9IHg7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5vbigndXNlckNoYW5nZWQnLCBoYW5kbGVVc2VyQ2hhbmdlZCk7XHJcblxyXG5cdFx0c3RvcmVTZXJ2aWNlLmdldE9yZ3MoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ob3Jncyl7XHJcblx0XHRcdHZtLm9yZ3MgPSBvcmdzO1xyXG5cdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudE9yZyA9IHZtLm9yZ3NbMF07XHJcblx0XHRcdHJlZnJlc2hTdG9yZXModm0ub3Jnc1swXSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRldmVudFNlcnZpY2Uub24oJ29yZ0NoYW5nZWQnLCBmdW5jdGlvbihlLCBvcmcpe1xyXG5cdFx0XHQvL3ZtLm9yZyA9IG9yZztcclxuXHRcdFx0cmVmcmVzaFN0b3JlcyhvcmcpO1xyXG5cdFx0XHRcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hTdG9yZXMob3JnKXtcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0U3RvcmVzKG9yZylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmVzKXtcclxuXHRcdFx0XHR2bS5zdG9yZXMgPSBzdG9yZXM7XHJcblx0XHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSA9IHZtLnN0b3Jlc1swXTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVVc2VyQ2hhbmdlZCh1c2VyKSB7XHJcblx0XHR2bS51c2VyID0gdXNlcjtcclxuXHR9XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=