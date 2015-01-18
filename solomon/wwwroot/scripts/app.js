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
            getStores: getStores,
            on: _listen
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
            if (_currentStore && value && _currentStore.id == value.id)
                return;
            _currentStore = value;
            eventService.raise('storeChanged', _currentStore);
        }
        function _listen(name, handler) {
            eventService.on(name, handler);
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
    function ChatFactory($rootScope, httpClient, socket, $q, storeService) {
        var service = {
            sendMessage: sendMessage,
            getById: _getById,
            getAllForStore: _getAllForStore
        };
        init();
        return service;
        function _getById(id) {
            return httpClient.get('/chat/' + id).then(function (res) {
                return res.data;
            });
        }
        function _getAllForStore(storeId) {
            if (!storeId)
                return $q.reject('no store id');
            return httpClient.get('/stores/' + storeId + '/chat').then(function (res) {
                return res.data;
            });
        }
        function sendMessage(id, message) {
            var url = '/chat/' + id + '/messages';
            return httpClient.post(url, { message: message }).then(function (res) {
                return res.data;
            });
        }
        function init() {
            socket.on('connect', function (a, b) {
                var id = storeService.currentStore && storeService.currentStore.id;
                if (id)
                    _register(id);
            });
            storeService.on('storeChanged', function (e, store) {
                _register(store.id);
            });
            socket.on('message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
            socket.on('new-chat', function (data) {
                console.log('new-chat', data);
                $rootScope.$emit('new-chat', data);
            });
        }
        function _register(storeId) {
            console.log('register: ' + storeId);
            socket.emit('register', {
                app: 'solomon',
                storeId: storeId
            });
        }
    }
    ChatFactory.$inject = ["$rootScope", "httpClient", "socket", "$q", "storeService"];
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
    function ChatListController(storeService, httpClient, eventService, chatService, $rootScope, securityService) {
        var vm = angular.extend(this, {
            chats: null,
            sendMessage: sendMessage,
            currentChat: null,
            selectChat: _selectChat,
            isSelected: _isChatSelected
        });
        eventService.on('storeChanged', onStoreChanged);
        $rootScope.$on('chat-message', function (e, msg) {
            if (securityService.currentUser()._id == msg.user)
                return;
            var chat = getChat(msg.chat);
            if (vm.currentChat && vm.currentChat._id == msg.chat) {
                vm.currentChat.messages.push({
                    message: msg.message,
                    time: msg.time,
                    user: msg.user
                });
            } else {
                chat.hasUnread = true;
            }
        });
        $rootScope.$on('new-chat', function (e, msg) {
            vm.chats.unshift(msg);
        });
        function onStoreChanged(e, store) {
            refreshChats(store);
        }
        function refreshChats(store) {
            return chatService.getAllForStore(store.id).then(function (chatlist) {
                vm.chats = chatlist;
            });
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
        function _selectChat(id) {
            chatService.getById(id).then(function (chat) {
                vm.currentChat = chat;
                //vm.hasUnread = false;
                getChat(chat._id).hasUnread = false;
            });
        }
        function _isChatSelected(chat) {
            if (!vm.currentChat)
                return false;
            return chat._id == vm.currentChat._id;
        }
        function getChat(id) {
            for (var i = 0; i < vm.chats.length; i++) {
                if (vm.chats[i]._id == id)
                    return vm.chats[i];
            }
            return null;
        }
    }
    ChatListController.$inject = ["storeService", "httpClient", "eventService", "chatService", "$rootScope", "securityService"];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJjb21tb24vZGF0YS9kYXRhLm1vZHVsZS5qcyIsImNvbW1vbi9kYXRhL3V0aWwuanMiLCJjb21tb24vZGF0YS9zdG9yZVNlcnZpY2UuanMiLCJhcmVhcy90YXNrcy90YXNrcy5tb2R1bGUuanMiLCJhcmVhcy90YXNrcy90YXNrcy5yb3V0ZXMuanMiLCJhcmVhcy90YXNrcy90YXNrbGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvc3RvcmVzL3N0b3Jlcy5tb2R1bGUuanMiLCJhcmVhcy9zdG9yZXMvU3RvcmVzQ29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMubW9kdWxlLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5yb3V0ZXMuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLm1vZHVsZS5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvc29ja2V0QnVpbGRlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5tb2R1bGUuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5yb3V0ZXMuanMiLCJhcmVhcy9jaGF0L2NoYXQuY29udHJvbGxlci5qcyIsImFyZWFzL2FzaWRlL2FzaWRlLmNvbnRyb2xsZXIuanMiLCJsYXlvdXQvc2hlbGwuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQuc3RhdGVzLmpzIiwibGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIiwiY29uZmlnL2NvbmZpZy5tb2R1bGUuanMiLCJlbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsInNvY2tldEZhY3RvcnkiLCJlbnYiLCJzdG9yYWdlU2VydmljZSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJkZXZpY2UiLCJnZXQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwiYXBpUm9vdCIsInF1ZXJ5IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJzZWN1cml0eVNlcnZpY2UiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJfbGlzdGVuZXJzIiwic2VydmljZSIsImN1cnJlbnRVc2VyIiwicmVxdWVzdEN1cnJlbnRVc2VyIiwiX3JlcXVlc3RDdXJyZW50VXNlciIsIm9uIiwiYWRkTGlzdGVuZXIiLCJsb2dpbiIsIl9sb2dpbiIsImxvZ291dCIsIl9sb2dvdXQiLCJldmVudE5hbWUiLCJsaXN0ZW5lciIsInB1c2giLCJmaXJlRXZlbnQiLCJhcmdzIiwiaGFuZGxlciIsImV2ZW50QXJncyIsInNwbGljZSIsImNhbGwiLCJmb3JFYWNoIiwiY2IiLCJ0b2tlbiIsIndoZW4iLCJvcHRpb25zIiwiY2FjaGUiLCJhdXRoIiwiZGVmZXIiLCJ0aGVuIiwicmVzcG9uc2UiLCJkYXRhIiwicmVzb2x2ZSIsImNhdGNoIiwicmVzIiwic3RhdHVzIiwicmVqZWN0IiwicHJvbWlzZSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJwZXJzaXN0IiwidGV4dCIsImJ0b2EiLCJwb3N0IiwiYXV0aF90b2tlbiIsInVzZXIiLCJzZXQiLCJyZW1vdmUiLCJnbyIsIl9zZXRVc2VyIiwicnVuIiwiZGVidWdSb3V0ZXMiLCIkcm9vdFNjb3BlIiwiJHN0YXRlUGFyYW1zIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJmcm9tU3RhdGUiLCJmcm9tUGFyYW1zIiwiY29uc29sZSIsImxvZyIsImFyZ3VtZW50cyIsInVuZm91bmRTdGF0ZSIsInRvIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsImdldFNlY3Rpb25zIiwicmVnaXN0ZXIiLCJyZWdpc3RlclNlY3Rpb25zIiwiZ2V0TW9kdWxlcyIsInNlY3Rpb25zIiwic3RhdGUiLCJwYXJlbnQiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJ4Iiwic2V0dGluZ3MiLCJsb2dnZXJTZXJ2aWNlIiwiJGxvZyIsImluZm8iLCJ3YXJuaW5nIiwiZXJyb3IiLCJtZXNzYWdlIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiJGh0dHBQcm92aWRlciIsImJhc2VVcmkiLCJkZWZhdWx0cyIsInVzZVhEb21haW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJkaXJlY3RpdmUiLCJ1aVN0YXRlIiwicmVzdHJpY3QiLCJsaW5rIiwicmVxdWlyZSIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwidWlTcmVmQWN0aXZlIiwibmFtZSIsIiRldmFsIiwicGFyYW1zIiwidWlTdGF0ZVBhcmFtcyIsInVybCIsImhyZWYiLCIkc2V0IiwiVXRpbFNlcnZpY2UiLCJldmVudFNlcnZpY2UiLCJhZGRQcm9wZXJ0eSIsInV1aWQiLCJnZW5lcmF0ZVVVSUQiLCJvYmoiLCJnZXR0ZXIiLCJzZXR0ZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImNyZWF0ZUdldHRlciIsImNyZWF0ZVNldHRlciIsImZpZWxkIiwidmFsdWUiLCJvbGRWYWx1ZSIsInJhaXNlIiwicHJvcGVydHkiLCJvcmlnaW5hbFZhbHVlIiwiZCIsIkRhdGUiLCJnZXRUaW1lIiwicmVwbGFjZSIsImMiLCJyIiwiTWF0aCIsInJhbmRvbSIsImZsb29yIiwidG9TdHJpbmciLCJTdG9yZVNlcnZpY2UiLCJfY3VycmVudFN0b3JlIiwiX2N1cnJlbnRPcmciLCJnZXRPcmdzIiwiZ2V0U3RvcmVzIiwiX2xpc3RlbiIsImVudW1lcmFibGUiLCJnZXRfY3VycmVudE9yZyIsInNldF9jdXJyZW50T3JnIiwiZ2V0X2N1cnJlbnRTdG9yZSIsInNldF9jdXJyZW50U3RvcmUiLCJvcmciLCJfaWQiLCJpZCIsImFwcFJ1biIsInNlY3Rpb25NYW5hZ2VyIiwiZ2V0U3RhdGVzIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwib3JkZXIiLCJpY29uIiwiVGFza0xpc3RDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwidm0iLCJ0YXNrcyIsIm9uU3RvcmVDaGFuZ2VkIiwicmVmcmVzaFRhc2tzIiwiY3VycmVudFN0b3JlIiwiZSIsInN0b3JlIiwiU3RvcmVzQ29udHJvbGxlciIsInN0b3JlcyIsInNlbGVjdGVkIiwic2VsZWN0IiwiaW5pdCIsIkxvZ2luQ29udHJvbGxlciIsInJlbWVtYmVyTWUiLCJidXN5IiwicmV0IiwiZXgiLCJmaW5hbGx5IiwiY29uZmlndXJlUm91dGVzIiwiZ2V0Um91dGVzIiwiRW1wbG95ZWVzQ29udHJvbGxlciIsImVtcGxveWVlcyIsInJlZnJlc2hFbXBsb3llZXMiLCJEYXNoYm9hcmRDb250cm9sbGVyIiwiQ2hhdEZhY3RvcnkiLCJzb2NrZXQiLCJzZW5kTWVzc2FnZSIsImdldEJ5SWQiLCJfZ2V0QnlJZCIsImdldEFsbEZvclN0b3JlIiwiX2dldEFsbEZvclN0b3JlIiwic3RvcmVJZCIsImEiLCJiIiwiX3JlZ2lzdGVyIiwiJGVtaXQiLCJlbWl0IiwiYXBwIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdFNlcnZpY2UiLCJjaGF0cyIsImN1cnJlbnRDaGF0Iiwic2VsZWN0Q2hhdCIsIl9zZWxlY3RDaGF0IiwiaXNTZWxlY3RlZCIsIl9pc0NoYXRTZWxlY3RlZCIsIm1zZyIsImNoYXQiLCJnZXRDaGF0IiwibWVzc2FnZXMiLCJ0aW1lIiwiaGFzVW5yZWFkIiwidW5zaGlmdCIsInJlZnJlc2hDaGF0cyIsImNoYXRsaXN0Iiwic2VudCIsImN1cnJlbnRNZXNzYWdlIiwiaSIsImxlbmd0aCIsIkFzaWRlQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsImluaXRpYWxpemVTdGF0ZXMiLCJlbnN1cmVBdXRoZW50aWNhdGVkIiwiJHRpbWVvdXQiLCJzaG93U3BsYXNoIiwicHJldmVudERlZmF1bHQiLCJ1IiwidGFyZ2V0U3RhdGUiLCJ3YWl0aW5nRm9yVmlldyIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIm90aGVyd2lzZSIsImFic3RyYWN0IiwidGVtcGxhdGUiLCIkc2NvcGUiLCJvbkVudGVyIiwiSGVhZGVyQ29udHJvbGxlciIsInV0aWwiLCJvcmdzIiwiY3VycmVudE9yZyIsImhhbmRsZVVzZXJDaGFuZ2VkIiwicmVmcmVzaFN0b3JlcyIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQURKQSxRQUFRQyxPQUFPLGNBQWE7UUFDM0I7UUFDQTs7S0FJSTtBQ05MLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDVkMsUUFBUSw0REFBaUIsVUFBVUMsZUFBZUMsS0FBS0MsZ0JBQWdCO1FBRXBFLElBQUlDLFVBQVUsVUFBVUMsV0FBVztZQUUvQkEsWUFBWUEsYUFBYTtZQUV6QixJQUFJQyxTQUFTSCxlQUFlSSxJQUFJOzs7WUFLaEMsSUFBSUMsYUFBYUMsR0FBR0Ms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SyxVQUFTMEQsR0FBRztnQkFDakJrRixHQUFHNUgsT0FBTzBDOztZQUdaM0YsZ0JBQWdCVSxHQUFHLGVBQWVrUDtZQUVsQ2hGLGFBQWFwQixVQUNadkgsS0FBSyxVQUFTeU4sTUFBSztnQkFDbkI3RSxHQUFHNkUsT0FBT0E7Z0JBQ1Y5RSxhQUFhK0UsYUFBYTlFLEdBQUc2RSxLQUFLO2dCQUNsQ0csY0FBY2hGLEdBQUc2RSxLQUFLOztZQUd2QmhJLGFBQWFoSCxHQUFHLGNBQWMsVUFBU3dLLEdBQUdsQixLQUFJOztnQkFFN0M2RixjQUFjN0Y7OztRQU1oQixTQUFTNkYsY0FBYzdGLEtBQUk7WUFDMUIsT0FBT1ksYUFBYW5CLFVBQVVPLEtBQzVCL0gsS0FBSyxVQUFTb0osUUFBTztnQkFDckJSLEdBQUdRLFNBQVNBO2dCQUNaVCxhQUFhSyxlQUFlSixHQUFHUSxPQUFPOzs7UUFJekMsU0FBU3VFLGtCQUFrQjNNLE1BQU07WUFDaEM0SCxHQUFHNUgsT0FBT0E7Ozs7S0FMUDtBQ3ZETCxDQUFDLFlBQVk7SUFDVDtLQUNDO0FDRkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5FLFFBQVFDLE9BQU8sY0FBYztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDZCtRLFNBQVMsT0FBTyxFQUNiblEsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc29ja2V0JyxbXHJcblx0J2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cdCdzeW1iaW90ZS5jb21tb24nXHJcblx0XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52LCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZS1pZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyB1bmRlZmluZWQgdGhlbiBnZW5lcmF0ZSBhIG5ldyBkZXZpY2Uga2V5XHJcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBzZXBlcmF0ZWQgaW50byBhIGRpZmZlcmVudCBzZXJ2aWNlLlxyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpe1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN1cml0eScsIFtdKVxyXG4gICAgLmZhY3RvcnkoJ3NlY3VyaXR5U2VydmljZScsIHNlY3VyaXR5U2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdXJpdHlTZXJ2aWNlKHN0b3JhZ2VTZXJ2aWNlLCAkc3RhdGUsIGh0dHBDbGllbnQsICRxKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50VXNlciA9IG51bGw7XHJcbiAgICB2YXIgX2xpc3RlbmVycyA9IHt9O1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGN1cnJlbnRVc2VyOiBmdW5jdGlvbigpe3JldHVybiBfY3VycmVudFVzZXI7fSxcclxuICAgICAgICByZXF1ZXN0Q3VycmVudFVzZXI6IF9yZXF1ZXN0Q3VycmVudFVzZXIsXHJcblxyXG4gICAgICAgIG9uOiBhZGRMaXN0ZW5lcixcclxuXHJcbiAgICAgICAgbG9naW46IF9sb2dpbixcclxuICAgICAgICBsb2dvdXQ6IF9sb2dvdXRcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcil7XHJcbiAgICAgICAgaWYoIV9saXN0ZW5lcnNbZXZlbnROYW1lXSlcclxuICAgICAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZmlyZUV2ZW50KGV2ZW50TmFtZSwgYXJncyl7XHJcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBfbGlzdGVuZXJzW2V2ZW50TmFtZV07XHJcbiAgICAgICAgaWYoIWhhbmRsZXIpIFxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBldmVudEFyZ3MgPSBbXS5zcGxpY2UuY2FsbChhcmdzLCAxKTtcclxuICAgICAgICBoYW5kbGVyLmZvckVhY2goZnVuY3Rpb24oY2Ipe1xyXG4gICAgICAgICAgICBjYihldmVudEFyZ3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pIHtcclxuXHJcbiAgICAgICAgaWYgKF9jdXJyZW50VXNlcilcclxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oX2N1cnJlbnRVc2VyKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0b2tlbilcclxuICAgICAgICAgICAgb3B0aW9ucy5hdXRoID0ge1xyXG4gICAgICAgICAgICAgICAgJ0JlYXJlcic6IHRva2VuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgICAgIGh0dHBDbGllbnQuZ2V0KCcvdG9rZW5zL2N1cnJlbnQnLCBvcHRpb25zKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIF9jdXJyZW50VXNlciA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkLCBwZXJzaXN0KSB7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0ID0gYnRvYSh1c2VybmFtZSArIFwiOlwiICsgcGFzc3dvcmQpO1xyXG4gICAgICAgIHZhciB0b2tlbiA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiBodHRwQ2xpZW50LnBvc3QoJy90b2tlbnMnLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ0Jhc2ljJzogdGV4dFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRva2VuID0gcmVzLmRhdGEuYXV0aF90b2tlbjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbik7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZVNlcnZpY2Uuc2V0KFwiYXV0aC10b2tlblwiLCB0b2tlbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ291dCgpIHtcclxuICAgICAgICBzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3Rva2VuJyk7XHJcbiAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9zZXRVc2VyKHVzZXIpe1xyXG4gICAgICAgIF9jdXJyZW50VXNlciA9IHVzZXI7XHJcbiAgICAgICAgZmlyZUV2ZW50KCd1c2VyQ2hhbmdlZCcsIHVzZXIpO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpLnJ1bihkZWJ1Z1JvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZGVidWdSb3V0ZXMoJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgIC8vIENyZWRpdHM6IEFkYW0ncyBhbnN3ZXIgaW4gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3ODYyNjIvNjkzNjJcclxuICAgIC8vIFBhc3RlIHRoaXMgaW4gYnJvd3NlcidzIGNvbnNvbGVcclxuXHJcbiAgICAvL3ZhciAkcm9vdFNjb3BlID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdWktdmlld11cIilbMF0pLmluamVjdG9yKCkuZ2V0KCckcm9vdFNjb3BlJyk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlTm90Rm91bmQgJyArIHVuZm91bmRTdGF0ZS50byArICcgIC0gZmlyZWQgd2hlbiBhIHN0YXRlIGNhbm5vdCBiZSBmb3VuZCBieSBpdHMgbmFtZS4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3RhcnQgdG8gJyArIHRvU3RhdGUudG8gKyAnLSBmaXJlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGJlZ2lucy4gdG9TdGF0ZSx0b1BhcmFtcyA6IFxcbicsIHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MgdG8gJyArIHRvU3RhdGUubmFtZSArICctIGZpcmVkIG9uY2UgdGhlIHN0YXRlIHRyYW5zaXRpb24gaXMgY29tcGxldGUuJyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyR2aWV3Q29udGVudExvYWRlZCAtIGZpcmVkIGFmdGVyIGRvbSByZW5kZXJlZCcsIGV2ZW50KTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH07XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRpZihzdGF0ZS5wYXJlbnQgPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdHN0YXRlLnBhcmVudCA9ICdhcHAtcm9vdCc7XHJcblxyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmNvbmZpZycsXHJcbiAgICAgICAgJ2FwcC5sYXlvdXQnLFxyXG4gICAgICAgICdhcHAubG9nZ2luZycsXHJcbiAgICAgICAgJ2FwcC5zZWN0aW9ucycsXHJcbiAgICAgICAgJ2FwcC5zZWN1cml0eScsXHJcbiAgICAgICAgJ2FwcC5kYXRhJyxcclxuICAgICAgICAnYXBwLnNvY2tldCcsXHJcbiAgICAgICAgJ3NvbG9tb24ucGFydGlhbHMnLFxyXG4gICAgICAgICdhcHAuZGFzaGJvYXJkJyxcclxuICAgICAgICAnYXBwLnN0b3JlcycsXHJcbiAgICAgICAgJ2FwcC50YXNrcycsXHJcbiAgICAgICAgJ2FwcC5jaGF0JyxcclxuICAgICAgICAnYXBwLmVtcGxveWVlcycsXHJcbiAgICAgICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAgICAgJ25nQW5pbWF0ZSdcclxuICAgIF0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uY29uZmlnKGNvbmZpZyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlnKGh0dHBDbGllbnRQcm92aWRlciwgJGh0dHBQcm92aWRlcil7XHJcblx0aHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5jYWNoZSA9IHRydWU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcblx0LmRpcmVjdGl2ZSgndWlTdGF0ZScsIHVpU3RhdGUpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHVpU3RhdGUoJHN0YXRlKSB7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0EnLFxyXG5cdFx0bGluazogbGluayxcclxuXHRcdHJlcXVpcmU6ICc/XnVpU3JlZkFjdGl2ZSdcclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3V0aWwnLCBVdGlsU2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBVdGlsU2VydmljZShldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRhZGRQcm9wZXJ0eTogYWRkUHJvcGVydHksXHJcblx0XHR1dWlkOiBnZW5lcmF0ZVVVSURcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gYWRkUHJvcGVydHkob2JqLCBuYW1lLCBnZXR0ZXIsIHNldHRlcikge1xyXG5cclxuXHJcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XHJcblx0XHRcdGdldDogZ2V0dGVyIHx8IGNyZWF0ZUdldHRlcihvYmosIG5hbWUpLFxyXG5cdFx0XHRzZXQ6IHNldHRlciB8fCBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0cmV0dXJuIG9ialtmaWVsZF07XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY3JlYXRlU2V0dGVyKG9iaiwgbmFtZSkge1xyXG5cdFx0XHR2YXIgZmllbGQgPSAnXycgKyBuYW1lO1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHJcblx0XHRcdFx0dmFyIG9sZFZhbHVlID0gb2JqW2ZpZWxkXTtcclxuXHJcblx0XHRcdFx0b2JqW2ZpZWxkXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGV2ZW50U2VydmljZS5yYWlzZShuYW1lICsgJ0NoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRvYmo6IG9iaixcclxuXHRcdFx0XHRcdHByb3BlcnR5OiBuYW1lLFxyXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlLFxyXG5cdFx0XHRcdFx0b3JpZ2luYWxWYWx1ZTogb2xkVmFsdWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcclxuXHRcdHZhciBkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblx0XHR2YXIgdXVpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xyXG5cdFx0XHR2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcclxuXHRcdFx0ZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcclxuXHRcdFx0cmV0dXJuIChjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIHV1aWQ7XHJcblx0fTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScpXHJcblx0LmZhY3RvcnkoJ3N0b3JlU2VydmljZScsIFN0b3JlU2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSwgJHEpIHtcclxuXHJcblx0dmFyIF9jdXJyZW50U3RvcmU7XHJcblx0dmFyIF9jdXJyZW50T3JnO1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldE9yZ3M6IGdldE9yZ3MsXHJcblx0XHRnZXRTdG9yZXM6IGdldFN0b3JlcyxcclxuXHRcdG9uOiBfbGlzdGVuXHJcblx0fTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50T3JnJywge1xyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZSxcclxuXHRcdGdldDogZ2V0X2N1cnJlbnRPcmcsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50T3JnXHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudFN0b3JlJywge1xyXG5cdFx0Z2V0OiBnZXRfY3VycmVudFN0b3JlLFxyXG5cdFx0c2V0OiBzZXRfY3VycmVudFN0b3JlXHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBnZXRPcmdzKCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRTdG9yZXMob3JnKSB7XHJcblxyXG5cdFx0aWYoIW9yZyB8fCAhb3JnLl9pZClcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oW10pO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL29yZ2FuaXphdGlvbnMvJyArIG9yZy5faWQgKyAnL3N0b3JlcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudE9yZygpIHtcclxuXHRcdHJldHVybiBfY3VycmVudE9yZztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50T3JnKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50T3JnID09PSB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdF9jdXJyZW50T3JnID0gdmFsdWU7XHJcblx0XHRldmVudFNlcnZpY2UucmFpc2UoJ29yZ0NoYW5nZWQnLCBfY3VycmVudE9yZyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudFN0b3JlKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50U3RvcmU7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRfY3VycmVudFN0b3JlKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50U3RvcmUgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0aWYoX2N1cnJlbnRTdG9yZSAmJiB2YWx1ZSAmJiBfY3VycmVudFN0b3JlLmlkID09IHZhbHVlLmlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRTdG9yZSA9IHZhbHVlO1xyXG5cdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKCdzdG9yZUNoYW5nZWQnLCBfY3VycmVudFN0b3JlKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9saXN0ZW4obmFtZSwgaGFuZGxlcil7XHJcblx0XHRldmVudFNlcnZpY2Uub24obmFtZSwgaGFuZGxlcik7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycsIFsnYXBwLmRhdGEnXSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnKVxyXG5cdC5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcblx0c2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ3Rhc2tzJyxcclxuXHRcdHVybDogJy90YXNrcycsXHJcblx0XHRjb250cm9sbGVyOiAnVGFza0xpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Rhc2tzL3Rhc2tsaXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogMyxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCdnbHlwaGljb24tdGFncyddXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQuY29udHJvbGxlcignVGFza0xpc3RDb250cm9sbGVyJywgVGFza0xpc3RDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBUYXNrTGlzdENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBodHRwQ2xpZW50LCBldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0dGFza3M6IG51bGxcclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdHJlZnJlc2hUYXNrcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hUYXNrcyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoVGFza3Moc3RvcmUpIHtcclxuXHJcblx0XHRpZiAoIXN0b3JlKSB7XHJcblx0XHRcdHZtLnRhc2tzID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0udGFza3MgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnLCBbJ3VpLnJvdXRlciddKVxyXG4ucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdzdG9yZXMnLFxyXG4gICAgICAgICAgICB1cmw6ICcvc3RvcmVzJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0b3Jlc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3N0b3Jlcy9zdG9yZXMuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMixcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1tYXAtbWFya2VyJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycpXHJcbi5jb250cm9sbGVyKCdTdG9yZXNDb250cm9sbGVyJywgU3RvcmVzQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBTdG9yZXNDb250cm9sbGVyKGh0dHBDbGllbnQpe1xyXG5cdFxyXG5cdHZhciB2bSA9IHRoaXM7XHJcblxyXG5cdHZtLnN0b3JlcyA9IFtdO1xyXG5cdHZtLnNlbGVjdGVkID0gbnVsbDtcclxuXHR2bS50YXNrcyA9IFtdO1xyXG5cclxuXHR2bS5zZWxlY3QgPSBmdW5jdGlvbihzdG9yZSl7XHJcblx0XHR2bS5zZWxlY3RlZCA9IHN0b3JlO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvdGFza3MnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnRhc2tzID0geC5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnN0b3JlcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JywgWyd1aS5ib290c3RyYXAnLCAndWkucm91dGVyJ10pOyAiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoW1xyXG5cclxuICAgIF0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIExvZ2luQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gTG9naW5Db250cm9sbGVyKHNlY3VyaXR5U2VydmljZSwgJHN0YXRlKXtcclxuXHRcclxuXHR2YXIgdm0gPXRoaXM7XHJcblx0dm0ubG9naW4gPSB7XHJcblx0XHR1c2VybmFtZTogXCJcIixcclxuXHRcdHBhc3N3b3JkOiBcIlwiLFxyXG5cdFx0cmVtZW1iZXJNZTogZmFsc2VcclxuXHR9O1xyXG5cclxuXHR0aGlzLmJ1c3kgPSBmYWxzZTtcclxuXHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHR0aGlzLmxvZ2luID0gZnVuY3Rpb24oKXtcclxuXHRcdHRoaXMuYnVzeSA9IHRydWU7XHJcblx0XHR0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5sb2dpbih2bS5sb2dpbi51c2VybmFtZSwgdm0ubG9naW4ucGFzc3dvcmQsIHZtLmxvZ2luLnJlbWVtYmVyTWUpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcclxuXHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KXtcclxuXHRcdFx0XHR2bS5tZXNzYWdlID0gKGV4LmRhdGEgJiYgZXguZGF0YS5tZXNzYWdlKSB8fCBcIlVuYWJsZSB0byBsb2cgaW5cIjtcclxuXHJcblx0XHRcdH0pLmZpbmFsbHkoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHR2bS5idXN5ID0gZmFsc2U7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9O1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJywgWydhcHAuZGF0YSddKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycpXHJcbi5ydW4oY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoc2VjdGlvbk1hbmFnZXIpe1xyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFJvdXRlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Um91dGVzKCl7XHJcblx0cmV0dXJuIFt7XHJcblx0XHRuYW1lOiAnZW1wbG95ZWVzJyxcclxuXHRcdHVybDogJy9lbXBsb3llZXMnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0VtcGxveWVlc0NvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDQsXHJcblx0XHRcdGljb246IFsnZmEnLCAnZmEtdXNlcnMnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG5cdC5jb250cm9sbGVyKCdFbXBsb3llZXNDb250cm9sbGVyJywgRW1wbG95ZWVzQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gRW1wbG95ZWVzQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIGV2ZW50U2VydmljZSwgaHR0cENsaWVudCkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlbXBsb3llZXM6IFtdXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHQvLyByZWZyZXNoRW1wbG95ZWVzKHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUpO1xyXG5cclxuXHRmdW5jdGlvbiBvblN0b3JlQ2hhbmdlZChlLCBzdG9yZSkge1xyXG5cdFx0cmVmcmVzaEVtcGxveWVlcyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoRW1wbG95ZWVzKHN0b3JlKSB7XHJcblx0XHRpZiAoIXN0b3JlKSB7XHJcblx0XHRcdHZtLmVtcGxveWVlcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy9lbXBsb3llZXMnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5lbXBsb3llZXMgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMSxcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1zdGF0cyddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJylcclxuICAgIC5jb250cm9sbGVyKCdEYXNoYm9hcmRDb250cm9sbGVyJywgRGFzaGJvYXJkQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRGFzaGJvYXJkQ29udHJvbGxlcigpIHtcclxuICAgIHRoaXMubWVzc2FnZSA9IFwiSGVsbG8gV29ybGRcIjtcclxufSIsIihmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbn0oKSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jaGF0JyxbJ2FwcC5zb2NrZXQnXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jaGF0JylcclxuXHQuZmFjdG9yeSgnY2hhdFNlcnZpY2UnLCBDaGF0RmFjdG9yeSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdEZhY3RvcnkoJHJvb3RTY29wZSwgaHR0cENsaWVudCwgc29ja2V0LCAkcSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0c2VuZE1lc3NhZ2U6IHNlbmRNZXNzYWdlLFxyXG5cdFx0Z2V0QnlJZDogX2dldEJ5SWQsXHJcblx0XHRnZXRBbGxGb3JTdG9yZTogX2dldEFsbEZvclN0b3JlXHJcblx0fVxyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBfZ2V0QnlJZChpZCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfZ2V0QWxsRm9yU3RvcmUoc3RvcmVJZCkge1xyXG5cclxuXHRcdGlmICghc3RvcmVJZClcclxuXHRcdFx0cmV0dXJuICRxLnJlamVjdCgnbm8gc3RvcmUgaWQnKTtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlSWQgKyAnL2NoYXQnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoaWQsIG1lc3NhZ2UpIHtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9jaGF0LycgKyBpZCArICcvbWVzc2FnZXMnO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHtcclxuXHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlXHJcblx0XHRcdH0pXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbml0KCkge1xyXG5cclxuXHRcdHNvY2tldC5vbignY29ubmVjdCcsIGZ1bmN0aW9uKGEsIGIpIHtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBpZCA9IHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgJiYgc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZS5pZDtcclxuXHRcdFx0aWYoaWQpXHJcblx0XHRcdFx0X3JlZ2lzdGVyKGlkKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgZnVuY3Rpb24oZSwgc3RvcmUpIHtcclxuXHRcdFx0X3JlZ2lzdGVyKHN0b3JlLmlkKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ2NoYXQtbWVzc2FnZScsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0c29ja2V0Lm9uKCduZXctY2hhdCcsIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ25ldy1jaGF0JywgZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ25ldy1jaGF0JywgZGF0YSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9yZWdpc3RlcihzdG9yZUlkKSB7XHJcblx0XHRjb25zb2xlLmxvZygncmVnaXN0ZXI6ICcgKyBzdG9yZUlkKTtcclxuXHRcdHNvY2tldC5lbWl0KCdyZWdpc3RlcicsIHtcclxuXHRcdFx0YXBwOiAnc29sb21vbicsXHJcblx0XHRcdHN0b3JlSWQ6IHN0b3JlSWRcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcbi5ydW4oY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoc2VjdGlvbk1hbmFnZXIpe1xyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCl7XHJcblx0cmV0dXJuIFt7XHJcblx0XHRuYW1lOiAnY2hhdC1saXN0JyxcclxuXHRcdHVybDogJy9jaGF0cycsXHJcblx0XHRjb250cm9sbGVyOiAnQ2hhdExpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdC1saXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogNCxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCAnZ2x5cGhpY29uLWNsb3VkJ11cclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmNvbnRyb2xsZXIoJ0NoYXRMaXN0Q29udHJvbGxlcicsIENoYXRMaXN0Q29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdExpc3RDb250cm9sbGVyKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlLCBjaGF0U2VydmljZSwgJHJvb3RTY29wZSwgc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGNoYXRzOiBudWxsLFxyXG5cdFx0c2VuZE1lc3NhZ2U6IHNlbmRNZXNzYWdlLFxyXG5cdFx0Y3VycmVudENoYXQ6IG51bGwsXHJcblx0XHRzZWxlY3RDaGF0OiBfc2VsZWN0Q2hhdCxcclxuXHRcdGlzU2VsZWN0ZWQ6IF9pc0NoYXRTZWxlY3RlZFxyXG5cdH0pO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGUsIG1zZykge1xyXG5cclxuXHRcdGlmKHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpLl9pZCA9PSBtc2cudXNlcilcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHZhciBjaGF0ID0gZ2V0Q2hhdChtc2cuY2hhdCk7XHJcblxyXG5cdFx0aWYgKHZtLmN1cnJlbnRDaGF0ICYmIHZtLmN1cnJlbnRDaGF0Ll9pZCA9PSBtc2cuY2hhdCkge1xyXG5cdFx0XHR2bS5jdXJyZW50Q2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHR0aW1lOiBtc2cudGltZSxcclxuXHRcdFx0XHR1c2VyOiBtc2cudXNlclxyXG5cdFx0XHR9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNoYXQuaGFzVW5yZWFkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJ25ldy1jaGF0JywgZnVuY3Rpb24oZSwgbXNnKXtcclxuXHRcdHZtLmNoYXRzLnVuc2hpZnQobXNnKTtcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hDaGF0cyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoQ2hhdHMoc3RvcmUpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5nZXRBbGxGb3JTdG9yZShzdG9yZS5pZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oY2hhdGxpc3QpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IGNoYXRsaXN0O1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGNoYXQsIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0Ll9pZCwgbWVzc2FnZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0Y2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHRcdG1lc3NhZ2U6IG1zZy5tZXNzYWdlLFxyXG5cdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHR1c2VyOiBtc2cudXNlcixcclxuXHRcdFx0XHRcdHNlbnQ6IHRydWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhleCk7XHJcblx0XHRcdH0pLmZpbmFsbHkoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y2hhdC5jdXJyZW50TWVzc2FnZSA9ICcnO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZWxlY3RDaGF0KGlkKSB7XHJcblx0XHRjaGF0U2VydmljZS5nZXRCeUlkKGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihjaGF0KSB7XHJcblx0XHRcdFx0dm0uY3VycmVudENoYXQgPSBjaGF0O1xyXG5cdFx0XHRcdC8vdm0uaGFzVW5yZWFkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGdldENoYXQoY2hhdC5faWQpLmhhc1VucmVhZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfaXNDaGF0U2VsZWN0ZWQoY2hhdCl7XHJcblxyXG5cdFx0aWYoIXZtLmN1cnJlbnRDaGF0KVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0cmV0dXJuIGNoYXQuX2lkID09IHZtLmN1cnJlbnRDaGF0Ll9pZDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldENoYXQoaWQpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdm0uY2hhdHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYgKHZtLmNoYXRzW2ldLl9pZCA9PSBpZClcclxuXHRcdFx0XHRyZXR1cm4gdm0uY2hhdHNbaV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0FzaWRlQ29udHJvbGxlcicsIEFzaWRlQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQXNpZGVDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNlY3Rpb25zOiBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKClcclxuXHR9KTtcclxuXHJcblx0Ly92bS5zZWN0aW9ucyA9IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5jb250cm9sbGVyKCdTaGVsbENvbnRyb2xsZXInLCBTaGVsbENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFNoZWxsQ29udHJvbGxlcihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIC8vdmFyIHZtID0gdGhpcztcclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29uZmlnKGluaXRpYWxpemVTdGF0ZXMpXHJcblx0LnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgc2VjdXJpdHlTZXJ2aWNlLCAkdGltZW91dCkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHRpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdXNlciA9IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpO1xyXG5cdFx0aWYgKHVzZXIpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1KSB7XHJcblxyXG5cdFx0XHRcdHZhciB0YXJnZXRTdGF0ZSA9IHUgPyB0b1N0YXRlIDogJ2xvZ2luJztcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKHRhcmdldFN0YXRlKTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgd2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcblx0XHRcclxuXHRcdGlmKCEkcm9vdFNjb3BlLnNob3dTcGxhc2gpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR3YWl0aW5nRm9yVmlldyA9IHRydWU7XHJcblx0fSk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbihlKSB7XHJcblxyXG5cclxuXHRcdGlmICh3YWl0aW5nRm9yVmlldyAmJiAkcm9vdFNjb3BlLnNob3dTcGxhc2gpIHtcclxuXHRcdFx0d2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdnaXZlIHRpbWUgdG8gcmVuZGVyJyk7XHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzaG93U3BsYXNoID0gZmFsc2UnKTtcclxuXHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHRcdFx0fSwgMTApO1xyXG5cclxuXHRcdH1cclxuXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdFx0dXJsOiAnJyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PicsXHJcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5zaG93U3BsYXNoID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly8gQG5nSW5qZWN0XHJcblx0XHRcdFx0dXNlcjogZnVuY3Rpb24oc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogLyogQG5nSW5qZWN0ICovIGZ1bmN0aW9uKCRzdGF0ZSwgdXNlcikge1xyXG5cdFx0XHRcdC8vIGlmKHVzZXIpXHJcblx0XHRcdFx0Ly8gICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0XHQvLyB1cmw6ICcnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiBcInZtXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xvZ2luL2xvZ2luLmh0bWwnXHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuXHRcdFx0Ly91cmw6ICcnLFxyXG5cdFx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvL3VzZXI6IGZ1bmN0aW9uKClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb250cm9sbGVyKCdIZWFkZXJDb250cm9sbGVyJywgSGVhZGVyQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsIHN0b3JlU2VydmljZSwgZXZlbnRTZXJ2aWNlLCB1dGlsKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdG1lc3NhZ2U6IFwiSGVsbG8gSGVhZGVyXCIsXHJcblx0XHR1c2VyOiBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIsXHJcblx0XHRvcmdzOiBbXSxcclxuXHRcdHN0b3JlczogW11cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnb3JnJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudE9yZzt9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSl7c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwgJ3N0b3JlJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlID0gdmFsdWU7fVxyXG5cdH0pO1xyXG5cclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdvcmcnKTtcclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdzdG9yZScpO1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRcdHZtLnVzZXIgPSB4O1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2Uub24oJ3VzZXJDaGFuZ2VkJywgaGFuZGxlVXNlckNoYW5nZWQpO1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRPcmdzKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKG9yZ3Mpe1xyXG5cdFx0XHR2bS5vcmdzID0gb3JncztcclxuXHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2bS5vcmdzWzBdO1xyXG5cdFx0XHRyZWZyZXNoU3RvcmVzKHZtLm9yZ3NbMF0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZXZlbnRTZXJ2aWNlLm9uKCdvcmdDaGFuZ2VkJywgZnVuY3Rpb24oZSwgb3JnKXtcclxuXHRcdFx0Ly92bS5vcmcgPSBvcmc7XHJcblx0XHRcdHJlZnJlc2hTdG9yZXMob3JnKTtcclxuXHRcdFx0XHJcblx0XHR9KTtcclxuXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoU3RvcmVzKG9yZyl7XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldFN0b3JlcyhvcmcpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3Jlcyl7XHJcblx0XHRcdFx0dm0uc3RvcmVzID0gc3RvcmVzO1xyXG5cdFx0XHRcdHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUgPSB2bS5zdG9yZXNbMF07XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlVXNlckNoYW5nZWQodXNlcikge1xyXG5cdFx0dm0udXNlciA9IHVzZXI7XHJcblx0fVxyXG59IiwiKGZ1bmN0aW9uICgpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxufSgpKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbmZpZycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbmZpZycpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9