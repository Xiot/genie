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
    angular.module('solomon').filter('fromNow', fromNowFilter);
    function fromNowFilter() {
        return function (date) {
            return moment(date).fromNow();
        };
    }
}());
(function () {
    'use strict';
    angular.module('solomon').directive('uiState', uiState);
    /* @ngInject */
    function uiState($state) {
        return {
            restrict: 'A',
            link: link,
            require: '?uiSrefActive'
        };
        function link(scope, element, attrs, uiSrefActive) {
            var name = scope.$eval(attrs.uiState);
            var params = scope.$eval(attrs.uiStateParams);
            var url = $state.href(name, params);
            if (url === '')
                url = '/';
            attrs.$set('href', url);
            var s = $state.get(name);
            if (!uiSrefActive)
                return;
            uiSrefActive.$$setStateInfo(s, {});
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
    function StoreService(httpClient, eventService, $q, storageService) {
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
                var orgId = storageService.get('org');
                if (orgId) {
                    service.currentOrg = _.find(res.data, { _id: orgId });
                }
                return res.data;
            });
        }
        function getStores(org) {
            if (!org || !org._id)
                return $q.when([]);
            return httpClient.get('/organizations/' + org._id + '/stores').then(function (res) {
                var storeId = storageService.get('store');
                if (storeId)
                    service.currentStore = _.find(res.data, { id: storeId });
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
            storageService.set('org', _currentOrg._id);
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
            var id = _currentStore && _currentStore.id;
            storageService.set('store', id);
            eventService.raise('storeChanged', _currentStore);
        }
        function _listen(name, handler) {
            eventService.on(name, handler);
        }
    }
    StoreService.$inject = ["httpClient", "eventService", "$q", "storageService"];
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
                url: '/tickets',
                controller: 'TaskListController',
                controllerAs: 'vm',
                templateUrl: 'app/areas/tasks/tasklist.html',
                settings: {
                    module: true,
                    order: 3,
                    icon: [
                        'glyphicon',
                        'glyphicon-tags'
                    ],
                    displayName: 'tickets'
                }
            }];
    }
}());
(function () {
    'use strict';
    angular.module('app.tasks').controller('TaskListController', TaskListController);
    /* @ngInject */
    function TaskListController(storeService, httpClient, eventService) {
        var vm = angular.extend(this, {
            tasks: [],
            stats: []
        });
        eventService.on('storeChanged', onStoreChanged);
        refreshTasks(storeService.currentStore);
        refreshStats(storeService.currentStore);
        function onStoreChanged(e, store) {
            refreshTasks(store);
            refreshStats(store);
        }
        function refreshStats(store) {
            if (!store)
                return vm.stats = [];
            httpClient.get('/stores/' + store.id + '/tasks/stats').then(function (res) {
                var order = [
                    'unassigned',
                    'assigned',
                    'engaged',
                    'complete'
                ];
                var stats = _.sortBy(res.data, function (item) {
                    var index = order.indexOf(item.status);
                    if (index === -1)
                        index = 100;
                    return index;
                });
                vm.stats = stats;
            });
        }
        function refreshTasks(store) {
            if (!store) {
                vm.tasks = [];
                return;
            }
            httpClient.get('/stores/' + store.id + '/tasks/open').then(function (res) {
                vm.tasks = res.data.map(function (t) {
                    return new Task(t);
                });
            });
        }
    }
    TaskListController.$inject = ["storeService", "httpClient", "eventService"];
    function Task(rawTask) {
        this.rawTask = rawTask;
        angular.extend(this, rawTask);
        this.displayTitle = rawTask.title || rawTask.type;
    }
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
        refreshEmployees(storeService.currentStore);
        function onStoreChanged(e, store) {
            refreshEmployees(store);
        }
        function refreshEmployees(store) {
            if (!store) {
                vm.employees = [];
                return;
            }
            httpClient.get('/stores/' + store.id + '/employees', { cache: false }).then(function (res) {
                vm.employees = res.data;
            });
        }
    }
    EmployeesController.$inject = ["storeService", "eventService", "httpClient"];
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
                if (!storeService.currentOrg)
                    storeService.currentOrg = vm.orgs[0];
                refreshStores(storeService.currentOrg);
            });
            eventService.on('orgChanged', function (e, org) {
                //vm.org = org;
                refreshStores(org);
            });
        }
        function refreshStores(org) {
            return storeService.getStores(org).then(function (stores) {
                vm.stores = stores;
                if (!storeService.currentStore)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9maWx0ZXJzL2Zyb21Ob3cuZmlsdGVyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvdWlTdGF0ZS5qcyIsImNvbW1vbi9kYXRhL2RhdGEubW9kdWxlLmpzIiwiY29tbW9uL2RhdGEvdXRpbC5qcyIsImNvbW1vbi9kYXRhL3N0b3JlU2VydmljZS5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tzLm1vZHVsZS5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tzLnJvdXRlcy5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9zdG9yZXMvc3RvcmVzLm1vZHVsZS5qcyIsImFyZWFzL3N0b3Jlcy9TdG9yZXNDb250cm9sbGVyLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5tb2R1bGUuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLnJvdXRlcy5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuY29udHJvbGxlci5qcyIsImxheW91dC9sYXlvdXQubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4ubW9kdWxlLmpzIiwiYXJlYXMvbG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQubW9kdWxlLmpzIiwiYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5jb250cm9sbGVyLmpzIiwiYXJlYXMvY2hhdC9zb2NrZXRCdWlsZGVyLmpzIiwiYXJlYXMvY2hhdC9jaGF0Lm1vZHVsZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnJvdXRlcy5qcyIsImFyZWFzL2NoYXQvY2hhdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvYXNpZGUvYXNpZGUuY29udHJvbGxlci5qcyIsImxheW91dC9zaGVsbC5jb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5zdGF0ZXMuanMiLCJsYXlvdXQvaGVhZGVyLmNvbnRyb2xsZXIuanMiLCJjb25maWcvZW52aXJvbm1lbnQuanMiLCJjb25maWcvY29uZmlnLm1vZHVsZS5qcyIsImVudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5Iiwic29ja2V0RmFjdG9yeSIsImVudiIsInN0b3JhZ2VTZXJ2aWNlIiwiYnVpbGRlciIsIm5hbWVzcGFjZSIsImRldmljZSIsImdldCIsIm15SW9Tb2NrZXQiLCJpbyIsImNvbm5lY3QiLCJhcGlSb290IiwicXVlcnkiLCJteVNvY2tldCIsImlvU29ja2V0Iiwic29ja2V0QnVpbGRlciIsInNlY3VyaXR5U2VydmljZSIsIiRzdGF0ZSIsImh0dHBDbGllbnQiLCIkcSIsIl9jdXJyZW50VXNlciIsIl9saXN0ZW5lcnMiLCJzZXJ2aWNlIiwiY3VycmVudFVzZXIiLCJyZXF1ZXN0Q3VycmVudFVzZXIiLCJfcmVxdWVzdEN1cnJlbnRVc2VyIiwib24iLCJhZGRMaXN0ZW5lciIsImxvZ2luIiwiX2xvZ2luIiwibG9nb3V0IiwiX2xvZ291dCIsImV2ZW50TmFtZSIsImxpc3RlbmVyIiwicHVzaCIsImZpcmVFdmVudCIsImFyZ3MiLCJoYW5kbGVyIiwiZXZlbnRBcmdzIiwic3BsaWNlIiwiY2FsbCIsImZvckVhY2giLCJjYiIsInRva2VuIiwid2hlbiIsIm9wdGlvbnMiLCJjYWNoZSIsImF1dGgiLCJkZWZlciIsInRoZW4iLCJyZXNwb25zZSIsImRhdGEiLCJyZXNvbHZlIiwiY2F0Y2giLCJyZXMiLCJzdGF0dXMiLCJyZWplY3QiLCJwcm9taXNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInBlcnNpc3QiLCJ0ZXh0IiwiYnRvYSIsInBvc3QiLCJhdXRoX3Rva2VuIiwidXNlciIsInNldCIsInJlbW92ZSIsImdvIiwiX3NldFVzZXIiLCJydW4iLCJkZWJ1Z1JvdXRlcyIsIiRyb290U2NvcGUiLCIkc3RhdGVQYXJhbXMiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwiYXJndW1lbnRzIiwidW5mb3VuZFN0YXRlIiwidG8iLCJwcm92aWRlciIsInNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIiLCIkc3RhdGVQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiY29uZmlnIiwicmVzb2x2ZUFsd2F5cyIsImNvbmZpZ3VyZSIsIm9wdHMiLCJleHRlbmQiLCJodG1sNU1vZGUiLCIkZ2V0IiwiU2VjdGlvbk1hbmFnZXJTZXJ2aWNlIiwiX3NlY3Rpb25zIiwiZ2V0U2VjdGlvbnMiLCJyZWdpc3RlciIsInJlZ2lzdGVyU2VjdGlvbnMiLCJnZXRNb2R1bGVzIiwic2VjdGlvbnMiLCJzdGF0ZSIsInBhcmVudCIsInVuZGVmaW5lZCIsImZpbHRlciIsIngiLCJzZXR0aW5ncyIsImxvZ2dlclNlcnZpY2UiLCIkbG9nIiwiaW5mbyIsIndhcm5pbmciLCJlcnJvciIsIm1lc3NhZ2UiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiYmFzZVVyaSIsImRlZmF1bHRzIiwidXNlWERvbWFpbiIsIndpdGhDcmVkZW50aWFscyIsImZyb21Ob3dGaWx0ZXIiLCJkYXRlIiwibW9tZW50IiwiZnJvbU5vdyIsImRpcmVjdGl2ZSIsInVpU3RhdGUiLCJyZXN0cmljdCIsImxpbmsiLCJyZXF1aXJlIiwic2NvcGUiLCJlbGVtZW50IiwiYXR0cnMiLCJ1aVNyZWZBY3RpdmUiLCJuYW1lIiwiJGV2YWwiLCJwYXJhbXMiLCJ1aVN0YXRlUGFyYW1zIiwidXJsIiwiaHJlZiIsIiRzZXQiLCJzIiwiJCRzZXRTdGF0ZUluZm8iLCJVdGlsU2VydmljZSIsImV2ZW50U2VydmljZSIsImFkZFByb3BlcnR5IiwidXVpZCIsImdlbmVyYXRlVVVJRCIsIm9iaiIsImdldHRlciIsInNldHRlciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiY3JlYXRlR2V0dGVyIiwiY3JlYXRlU2V0dGVyIiwiZmllbGQiLCJ2YWx1ZSIsIm9sZFZhbHVlIiwicmFpc2UiLCJwcm9wZXJ0eSIsIm9yaWdpbmFsVmFsdWUiLCJkIiwiRGF0ZSIsImdldFRpbWUiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwiZmxvb3IiLCJ0b1N0cmluZyIsIlN0b3JlU2VydmljZSIsIl9jdXJyZW50U3RvcmUiLCJfY3VycmVudE9yZyIsImdldE9yZ3MiLCJnZXRTdG9yZXMiLCJfbGlzdGVuIiwiZW51bWVyYWJsZSIsImdldF9jdXJyZW50T3JnIiwic2V0X2N1cnJlbnRPcmciLCJnZXRfY3VycmVudFN0b3JlIiwic2V0X2N1cnJlbnRTdG9yZSIsIm9yZ0lkIiwiY3VycmVudE9yZyIsIl8iLCJmaW5kIiwiX2lkIiwib3JnIiwic3RvcmVJZCIsImN1cnJlbnRTdG9yZSIsImlkIiwiYXBwUnVuIiwic2VjdGlvbk1hbmFnZXIiLCJnZXRTdGF0ZXMiLCJjb250cm9sbGVyIiwiY29udHJvbGxlckFzIiwidGVtcGxhdGVVcmwiLCJvcmRlciIsImljb24iLCJkaXNwbGF5TmFtZSIsIlRhc2tMaXN0Q29udHJvbGxlciIsInN0b3JlU2VydmljZSIsInZtIiwidGFza3MiLCJzdGF0cyIsIm9uU3RvcmVDaGFuZ2VkIiwicmVmcmVzaFRhc2tzIiwicmVmcmVzaFN0YXRzIiwiZSIsInN0b3JlIiwic29ydEJ5IiwiaXRlbSIsImluZGV4IiwiaW5kZXhPZiIsIm1hcCIsInQiLCJUYXNrIiwicmF3VGFzayIsImRpc3BsYXlUaXRsZSIsInRpdGxlIiwidHlwZSIsIlN0b3Jlc0NvbnRyb2xsZXIiLCJzdG9yZXMiLCJzZWxlY3RlZCIsInNlbGVjdCIsImluaXQiLCJjb25maWd1cmVSb3V0ZXMiLCJnZXRSb3V0ZXMiLCJFbXBsb3llZXNDb250cm9sbGVyIiwiZW1wbG95ZWVzIiwicmVmcmVzaEVtcGxveWVlcyIsIkxvZ2luQ29udHJvbGxlciIsInJlbWVtYmVyTWUiLCJidXN5IiwicmV0IiwiZXgiLCJmaW5hbGx5IiwiRGFzaGJvYXJkQ29udHJvbGxlciIsIkNoYXRGYWN0b3J5Iiwic29ja2V0Iiwic2VuZE1lc3NhZ2UiLCJnZXRCeUlkIiwiX2dldEJ5SWQiLCJnZXRBbGxGb3JTdG9yZSIsIl9nZXRBbGxGb3JTdG9yZSIsImEiLCJiIiwiX3JlZ2lzdGVyIiwiJGVtaXQiLCJlbWl0IiwiYXBwIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdFNlcnZpY2UiLCJjaGF0cyIsImN1cnJlbnRDaGF0Iiwic2VsZWN0Q2hhdCIsIl9zZWxlY3RDaGF0IiwiaXNTZWxlY3RlZCIsIl9pc0NoYXRTZWxlY3RlZCIsIm1zZyIsImNoYXQiLCJnZXRDaGF0IiwibWVzc2FnZXMiLCJ0aW1lIiwiaGFzVW5yZWFkIiwidW5zaGlmdCIsInJlZnJlc2hDaGF0cyIsImNoYXRsaXN0Iiwic2VudCIsImN1cnJlbnRNZXNzYWdlIiwiaSIsImxlbmd0aCIsIkFzaWRlQ29udHJvbGxlciIsIlNoZWxsQ29udHJvbGxlciIsImluaXRpYWxpemVTdGF0ZXMiLCJlbnN1cmVBdXRoZW50aWNhdGVkIiwiJHRpbWVvdXQiLCJzaG93U3BsYXNoIiwicHJldmVudERlZmF1bHQiLCJ1IiwidGFyZ2V0U3RhdGUiLCJ3YWl0aW5nRm9yVmlldyIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIm90aGVyd2lzZSIsImFic3RyYWN0IiwidGVtcGxhdGUiLCIkc2NvcGUiLCJvbkVudGVyIiwiSGVhZGVyQ29udHJvbGxlciIsInV0aWwiLCJvcmdzIiwiaGFuZGxlVXNlckNoYW5nZWQiLCJyZWZyZXNoU3RvcmVzIiwiY29uc3RhbnQiXSwibWFwcGlu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UUFJMUMsU0FBU3FFLGtCQUFrQmxPLE1BQU07WUFDaEN5SSxHQUFHekksT0FBT0E7Ozs7S0FSUDtBQ3pETCxDQUFDLFlBQVk7SUFDVDtLQUNDO0FDRkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESm5FLFFBQVFDLE9BQU8sY0FBYztLQUd4QjtBQ0hMLENBQUMsWUFBWTtJQUNUO0lBREpELFFBQVFDLE9BQU8sY0FDZHNTLFNBQVMsT0FBTyxFQUNiMVIsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdhcHAuc29ja2V0JyxbXHJcblx0J2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cdCdzeW1iaW90ZS5jb21tb24nXHJcblx0XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52LCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZS1pZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyB1bmRlZmluZWQgdGhlbiBnZW5lcmF0ZSBhIG5ldyBkZXZpY2Uga2V5XHJcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBzZXBlcmF0ZWQgaW50byBhIGRpZmZlcmVudCBzZXJ2aWNlLlxyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcblxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpe1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN1cml0eScsIFtdKVxyXG4gICAgLmZhY3RvcnkoJ3NlY3VyaXR5U2VydmljZScsIHNlY3VyaXR5U2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdXJpdHlTZXJ2aWNlKHN0b3JhZ2VTZXJ2aWNlLCAkc3RhdGUsIGh0dHBDbGllbnQsICRxKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50VXNlciA9IG51bGw7XHJcbiAgICB2YXIgX2xpc3RlbmVycyA9IHt9O1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGN1cnJlbnRVc2VyOiBmdW5jdGlvbigpe3JldHVybiBfY3VycmVudFVzZXI7fSxcclxuICAgICAgICByZXF1ZXN0Q3VycmVudFVzZXI6IF9yZXF1ZXN0Q3VycmVudFVzZXIsXHJcblxyXG4gICAgICAgIG9uOiBhZGRMaXN0ZW5lcixcclxuXHJcbiAgICAgICAgbG9naW46IF9sb2dpbixcclxuICAgICAgICBsb2dvdXQ6IF9sb2dvdXRcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcil7XHJcbiAgICAgICAgaWYoIV9saXN0ZW5lcnNbZXZlbnROYW1lXSlcclxuICAgICAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgX2xpc3RlbmVyc1tldmVudE5hbWVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZmlyZUV2ZW50KGV2ZW50TmFtZSwgYXJncyl7XHJcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBfbGlzdGVuZXJzW2V2ZW50TmFtZV07XHJcbiAgICAgICAgaWYoIWhhbmRsZXIpIFxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBldmVudEFyZ3MgPSBbXS5zcGxpY2UuY2FsbChhcmdzLCAxKTtcclxuICAgICAgICBoYW5kbGVyLmZvckVhY2goZnVuY3Rpb24oY2Ipe1xyXG4gICAgICAgICAgICBjYihldmVudEFyZ3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0Q3VycmVudFVzZXIodG9rZW4pIHtcclxuXHJcbiAgICAgICAgaWYgKF9jdXJyZW50VXNlcilcclxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oX2N1cnJlbnRVc2VyKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0b2tlbilcclxuICAgICAgICAgICAgb3B0aW9ucy5hdXRoID0ge1xyXG4gICAgICAgICAgICAgICAgJ0JlYXJlcic6IHRva2VuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcblxyXG4gICAgICAgIGh0dHBDbGllbnQuZ2V0KCcvdG9rZW5zL2N1cnJlbnQnLCBvcHRpb25zKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIF9jdXJyZW50VXNlciA9IHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24ocmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlci5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZGVmZXIucmVqZWN0KHJlcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkLCBwZXJzaXN0KSB7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0ID0gYnRvYSh1c2VybmFtZSArIFwiOlwiICsgcGFzc3dvcmQpO1xyXG4gICAgICAgIHZhciB0b2tlbiA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiBodHRwQ2xpZW50LnBvc3QoJy90b2tlbnMnLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ0Jhc2ljJzogdGV4dFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRva2VuID0gcmVzLmRhdGEuYXV0aF90b2tlbjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbik7XHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZVNlcnZpY2Uuc2V0KFwiYXV0aC10b2tlblwiLCB0b2tlbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlcjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2xvZ291dCgpIHtcclxuICAgICAgICBzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3Rva2VuJyk7XHJcbiAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9zZXRVc2VyKHVzZXIpe1xyXG4gICAgICAgIF9jdXJyZW50VXNlciA9IHVzZXI7XHJcbiAgICAgICAgZmlyZUV2ZW50KCd1c2VyQ2hhbmdlZCcsIHVzZXIpO1xyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJywgWyd1aS5yb3V0ZXInXSk7XHJcblxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpLnJ1bihkZWJ1Z1JvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZGVidWdSb3V0ZXMoJHJvb3RTY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMpIHtcclxuICAgIC8vIENyZWRpdHM6IEFkYW0ncyBhbnN3ZXIgaW4gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjA3ODYyNjIvNjkzNjJcclxuICAgIC8vIFBhc3RlIHRoaXMgaW4gYnJvd3NlcidzIGNvbnNvbGVcclxuXHJcbiAgICAvL3ZhciAkcm9vdFNjb3BlID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdWktdmlld11cIilbMF0pLmluamVjdG9yKCkuZ2V0KCckcm9vdFNjb3BlJyk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZVBhcmFtcyA9ICRzdGF0ZVBhcmFtcztcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlRXJyb3IgLSBmaXJlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgdHJhbnNpdGlvbi4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhcmd1bWVudHMpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnJHN0YXRlTm90Rm91bmQgJyArIHVuZm91bmRTdGF0ZS50byArICcgIC0gZmlyZWQgd2hlbiBhIHN0YXRlIGNhbm5vdCBiZSBmb3VuZCBieSBpdHMgbmFtZS4nKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3RhcnQgdG8gJyArIHRvU3RhdGUudG8gKyAnLSBmaXJlZCB3aGVuIHRoZSB0cmFuc2l0aW9uIGJlZ2lucy4gdG9TdGF0ZSx0b1BhcmFtcyA6IFxcbicsIHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MgdG8gJyArIHRvU3RhdGUubmFtZSArICctIGZpcmVkIG9uY2UgdGhlIHN0YXRlIHRyYW5zaXRpb24gaXMgY29tcGxldGUuJyk7XHJcbiAgICAvLyB9KTtcclxuXHJcbiAgICAvLyAkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2coJyR2aWV3Q29udGVudExvYWRlZCAtIGZpcmVkIGFmdGVyIGRvbSByZW5kZXJlZCcsIGV2ZW50KTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5zZWN0aW9ucycpXHJcblx0LnByb3ZpZGVyKCdzZWN0aW9uTWFuYWdlcicsIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIHNlY3Rpb25NYW5hZ2VyUHJvdmlkZXIoJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XHJcblxyXG5cdHZhciBjb25maWcgPSB7XHJcblx0XHRyZXNvbHZlQWx3YXlzOiB7fVxyXG5cdH07XHJcblxyXG5cdHRoaXMuY29uZmlndXJlID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgb3B0cyk7XHJcblx0fTtcclxuXHJcblx0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xyXG5cclxuXHJcblx0dGhpcy4kZ2V0ID0gU2VjdGlvbk1hbmFnZXJTZXJ2aWNlO1xyXG5cclxuXHQvLyBAbmdJbmplY3RcclxuXHRmdW5jdGlvbiBTZWN0aW9uTWFuYWdlclNlcnZpY2UoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG5cdCAgICB2YXIgX3NlY3Rpb25zID0gW107XHJcblxyXG5cdFx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRcdGdldFNlY3Rpb25zOiBnZXRTZWN0aW9ucyxcclxuXHRcdFx0cmVnaXN0ZXI6IHJlZ2lzdGVyU2VjdGlvbnMsXHJcbiAgICAgICAgICAgIGdldE1vZHVsZXM6IGdldE1vZHVsZXNcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9ucyhzZWN0aW9ucykge1xyXG5cdFx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG5cclxuXHRcdFx0XHRpZihzdGF0ZS5wYXJlbnQgPT09IHVuZGVmaW5lZClcclxuXHRcdFx0XHRcdHN0YXRlLnBhcmVudCA9ICdhcHAtcm9vdCc7XHJcblxyXG5cdFx0XHRcdHN0YXRlLnJlc29sdmUgPVxyXG5cdFx0XHRcdFx0YW5ndWxhci5leHRlbmQoc3RhdGUucmVzb2x2ZSB8fCB7fSwgY29uZmlnLnJlc29sdmVBbHdheXMpO1xyXG5cdFx0XHRcdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKHN0YXRlKTtcclxuXHRcdFx0XHRfc2VjdGlvbnMucHVzaChzdGF0ZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGdldE1vZHVsZXMoKSB7XHJcblx0XHQgICAgcmV0dXJuICRzdGF0ZS5nZXQoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHtcclxuXHRcdCAgICAgICAgcmV0dXJuIHguc2V0dGluZ3MgJiYgeC5zZXR0aW5ncy5tb2R1bGU7XHJcblx0XHQgICAgfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VjdGlvbnMoKSB7XHJcblx0XHQgICAgLy9yZXR1cm4gJHN0YXRlLmdldCgpO1xyXG5cdFx0ICAgIHJldHVybiBfc2VjdGlvbnM7XHJcblx0XHR9XHJcblxyXG5cdH1cclxufVxyXG4iLCJcclxuYW5ndWxhci5tb2R1bGUoJ2FwcC5sb2dnaW5nJywgW10pOyIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnKVxyXG4gICAgLnNlcnZpY2UoJ2xvZ2dlcicsIGxvZ2dlclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGxvZ2dlclNlcnZpY2UoJGxvZykge1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGluZm86IGluZm8sXHJcbiAgICAgICAgd2FybmluZzogd2FybmluZyxcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbG9nOiAkbG9nXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpbmZvKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ0luZm86ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YXJuaW5nKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmluZm8oJ1dBUk5JTkc6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAgICAgJGxvZy5lcnJvcignRVJST1I6ICcgKyBtZXNzYWdlLCBkYXRhKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJyxcclxuICAgIFtcclxuICAgICAgICAnYXBwLmNvbmZpZycsXHJcbiAgICAgICAgJ2FwcC5sYXlvdXQnLFxyXG4gICAgICAgICdhcHAubG9nZ2luZycsXHJcbiAgICAgICAgJ2FwcC5zZWN0aW9ucycsXHJcbiAgICAgICAgJ2FwcC5zZWN1cml0eScsXHJcbiAgICAgICAgJ2FwcC5kYXRhJyxcclxuICAgICAgICAnYXBwLnNvY2tldCcsXHJcbiAgICAgICAgJ3NvbG9tb24ucGFydGlhbHMnLFxyXG4gICAgICAgICdhcHAuZGFzaGJvYXJkJyxcclxuICAgICAgICAnYXBwLnN0b3JlcycsXHJcbiAgICAgICAgJ2FwcC50YXNrcycsXHJcbiAgICAgICAgJ2FwcC5jaGF0JyxcclxuICAgICAgICAnYXBwLmVtcGxveWVlcycsXHJcbiAgICAgICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAgICAgJ25nQW5pbWF0ZSdcclxuICAgIF0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uY29uZmlnKGNvbmZpZyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlnKGh0dHBDbGllbnRQcm92aWRlciwgJGh0dHBQcm92aWRlcil7XHJcblx0aHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiO1xyXG5cclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLnVzZVhEb21haW4gPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy5jYWNoZSA9IHRydWU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcbi5maWx0ZXIoJ2Zyb21Ob3cnLCBmcm9tTm93RmlsdGVyKTtcclxuXHJcbmZ1bmN0aW9uIGZyb21Ob3dGaWx0ZXIoKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24oZGF0ZSl7XHJcblx0XHRyZXR1cm4gbW9tZW50KGRhdGUpLmZyb21Ob3coKTtcclxuXHR9O1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG5cdC5kaXJlY3RpdmUoJ3VpU3RhdGUnLCB1aVN0YXRlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiB1aVN0YXRlKCRzdGF0ZSkge1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdBJyxcclxuXHRcdGxpbms6IGxpbmssXHJcblx0XHRyZXF1aXJlOiAnP3VpU3JlZkFjdGl2ZSdcclxuXHR9O1xyXG4gXHJcblx0ZnVuY3Rpb24gbGluayhzY29wZSwgZWxlbWVudCwgYXR0cnMsIHVpU3JlZkFjdGl2ZSkge1xyXG5cclxuXHRcdHZhciBuYW1lID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZSk7XHJcblx0XHR2YXIgcGFyYW1zID0gc2NvcGUuJGV2YWwoYXR0cnMudWlTdGF0ZVBhcmFtcyk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICRzdGF0ZS5ocmVmKG5hbWUsIHBhcmFtcyk7XHJcblxyXG5cdFx0aWYodXJsID09PSBcIlwiKVxyXG5cdFx0XHR1cmwgPSBcIi9cIjtcclxuXHJcblx0XHRhdHRycy4kc2V0KCdocmVmJywgdXJsKTtcclxuXHJcblx0XHR2YXIgcyA9ICRzdGF0ZS5nZXQobmFtZSk7XHJcblxyXG5cdFx0aWYoIXVpU3JlZkFjdGl2ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0dWlTcmVmQWN0aXZlLiQkc2V0U3RhdGVJbmZvKHMsIHt9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhdGEnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJylcclxuXHQuZmFjdG9yeSgndXRpbCcsIFV0aWxTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFV0aWxTZXJ2aWNlKGV2ZW50U2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGFkZFByb3BlcnR5OiBhZGRQcm9wZXJ0eSxcclxuXHRcdHV1aWQ6IGdlbmVyYXRlVVVJRFxyXG5cdH07XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBhZGRQcm9wZXJ0eShvYmosIG5hbWUsIGdldHRlciwgc2V0dGVyKSB7XHJcblxyXG5cclxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcclxuXHRcdFx0Z2V0OiBnZXR0ZXIgfHwgY3JlYXRlR2V0dGVyKG9iaiwgbmFtZSksXHJcblx0XHRcdHNldDogc2V0dGVyIHx8IGNyZWF0ZVNldHRlcihvYmosIG5hbWUpXHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBjcmVhdGVHZXR0ZXIob2JqLCBuYW1lKSB7XHJcblx0XHRcdHZhciBmaWVsZCA9ICdfJyArIG5hbWU7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRyZXR1cm4gb2JqW2ZpZWxkXTtcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBjcmVhdGVTZXR0ZXIob2JqLCBuYW1lKSB7XHJcblx0XHRcdHZhciBmaWVsZCA9ICdfJyArIG5hbWU7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cclxuXHRcdFx0XHR2YXIgb2xkVmFsdWUgPSBvYmpbZmllbGRdO1xyXG5cclxuXHRcdFx0XHRvYmpbZmllbGRdID0gdmFsdWU7XHJcblx0XHRcdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKG5hbWUgKyAnQ2hhbmdlZCcsIHtcclxuXHRcdFx0XHRcdG9iajogb2JqLFxyXG5cdFx0XHRcdFx0cHJvcGVydHk6IG5hbWUsXHJcblx0XHRcdFx0XHR2YWx1ZTogdmFsdWUsXHJcblx0XHRcdFx0XHRvcmlnaW5hbFZhbHVlOiBvbGRWYWx1ZVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xyXG5cdFx0dmFyIGQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHRcdHZhciB1dWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XHJcblx0XHRcdHZhciByID0gKGQgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xyXG5cdFx0XHRkID0gTWF0aC5mbG9vcihkIC8gMTYpO1xyXG5cdFx0XHRyZXR1cm4gKGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KSkudG9TdHJpbmcoMTYpO1xyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gdXVpZDtcclxuXHR9O1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXRhJylcclxuXHQuZmFjdG9yeSgnc3RvcmVTZXJ2aWNlJywgU3RvcmVTZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoaHR0cENsaWVudCwgZXZlbnRTZXJ2aWNlLCAkcSwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIF9jdXJyZW50U3RvcmU7XHJcblx0dmFyIF9jdXJyZW50T3JnO1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldE9yZ3M6IGdldE9yZ3MsXHJcblx0XHRnZXRTdG9yZXM6IGdldFN0b3JlcyxcclxuXHRcdG9uOiBfbGlzdGVuXHJcblx0fTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50T3JnJywge1xyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZSxcclxuXHRcdGdldDogZ2V0X2N1cnJlbnRPcmcsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50T3JnXHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudFN0b3JlJywge1xyXG5cdFx0Z2V0OiBnZXRfY3VycmVudFN0b3JlLFxyXG5cdFx0c2V0OiBzZXRfY3VycmVudFN0b3JlXHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBnZXRPcmdzKCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhciBvcmdJZCA9IHN0b3JhZ2VTZXJ2aWNlLmdldCgnb3JnJyk7XHJcblx0XHRcdFx0aWYob3JnSWQpIHtcclxuXHRcdFx0XHRcdHNlcnZpY2UuY3VycmVudE9yZyA9IF8uZmluZChyZXMuZGF0YSwge19pZDogb3JnSWR9KTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRTdG9yZXMob3JnKSB7XHJcblxyXG5cdFx0aWYoIW9yZyB8fCAhb3JnLl9pZClcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oW10pO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL29yZ2FuaXphdGlvbnMvJyArIG9yZy5faWQgKyAnL3N0b3JlcycpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhciBzdG9yZUlkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdzdG9yZScpO1xyXG5cdFx0XHRcdGlmKHN0b3JlSWQpXHJcblx0XHRcdFx0XHRzZXJ2aWNlLmN1cnJlbnRTdG9yZSA9IF8uZmluZChyZXMuZGF0YSwge2lkOiBzdG9yZUlkfSk7XHJcblxyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudE9yZygpIHtcclxuXHRcdHJldHVybiBfY3VycmVudE9yZztcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50T3JnKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50T3JnID09PSB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdF9jdXJyZW50T3JnID0gdmFsdWU7XHJcblx0XHRzdG9yYWdlU2VydmljZS5zZXQoJ29yZycsIF9jdXJyZW50T3JnLl9pZCk7XHJcblx0XHRldmVudFNlcnZpY2UucmFpc2UoJ29yZ0NoYW5nZWQnLCBfY3VycmVudE9yZyk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRfY3VycmVudFN0b3JlKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50U3RvcmU7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRfY3VycmVudFN0b3JlKHZhbHVlKSB7XHJcblxyXG5cdFx0aWYgKF9jdXJyZW50U3RvcmUgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0aWYoX2N1cnJlbnRTdG9yZSAmJiB2YWx1ZSAmJiBfY3VycmVudFN0b3JlLmlkID09IHZhbHVlLmlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRTdG9yZSA9IHZhbHVlO1xyXG5cclxuXHRcdHZhciBpZCA9IF9jdXJyZW50U3RvcmUgJiYgX2N1cnJlbnRTdG9yZS5pZDtcclxuXHRcdHN0b3JhZ2VTZXJ2aWNlLnNldCgnc3RvcmUnLCBpZCk7XHJcblx0XHRcclxuXHRcdGV2ZW50U2VydmljZS5yYWlzZSgnc3RvcmVDaGFuZ2VkJywgX2N1cnJlbnRTdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfbGlzdGVuKG5hbWUsIGhhbmRsZXIpe1xyXG5cdFx0ZXZlbnRTZXJ2aWNlLm9uKG5hbWUsIGhhbmRsZXIpO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnLCBbJ2FwcC5kYXRhJ10pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICd0YXNrcycsXHJcblx0XHR1cmw6ICcvdGlja2V0cycsXHJcblx0XHRjb250cm9sbGVyOiAnVGFza0xpc3RDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Rhc2tzL3Rhc2tsaXN0Lmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogMyxcclxuXHRcdFx0aWNvbjogWydnbHlwaGljb24nLCdnbHlwaGljb24tdGFncyddLFxyXG5cdFx0XHRkaXNwbGF5TmFtZTogJ3RpY2tldHMnXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRhc2tzJylcclxuXHQuY29udHJvbGxlcignVGFza0xpc3RDb250cm9sbGVyJywgVGFza0xpc3RDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBUYXNrTGlzdENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBodHRwQ2xpZW50LCBldmVudFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0dGFza3M6IFtdLFxyXG5cdFx0c3RhdHM6IFtdXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHRyZWZyZXNoVGFza3Moc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblx0cmVmcmVzaFN0YXRzKHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUpO1xyXG5cclxuXHRmdW5jdGlvbiBvblN0b3JlQ2hhbmdlZChlLCBzdG9yZSkge1xyXG5cdFx0cmVmcmVzaFRhc2tzKHN0b3JlKTtcclxuXHRcdHJlZnJlc2hTdGF0cyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoU3RhdHMoc3RvcmUpe1xyXG5cdFx0aWYoIXN0b3JlKVxyXG5cdFx0XHRyZXR1cm4gdm0uc3RhdHMgPSBbXTtcclxuXHRcdFxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcy9zdGF0cycpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cclxuXHRcdFx0dmFyIG9yZGVyID0gWyd1bmFzc2lnbmVkJywgJ2Fzc2lnbmVkJywgJ2VuZ2FnZWQnLCAnY29tcGxldGUnXTtcclxuXHRcdFx0XHJcblx0XHRcdHZhciBzdGF0cyA9IF8uc29ydEJ5KHJlcy5kYXRhLCBmdW5jdGlvbihpdGVtKXtcclxuXHRcdFx0XHR2YXIgaW5kZXggPSBvcmRlci5pbmRleE9mKGl0ZW0uc3RhdHVzKTtcclxuXHRcdFx0XHRpZihpbmRleCA9PT0gLTEpXHJcblx0XHRcdFx0XHRpbmRleCA9IDEwMDtcclxuXHRcdFx0XHRyZXR1cm4gaW5kZXg7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0dm0uc3RhdHMgPSBzdGF0cztcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaFRhc2tzKHN0b3JlKSB7XHJcblxyXG5cdFx0aWYgKCFzdG9yZSkge1xyXG5cdFx0XHR2bS50YXNrcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcy9vcGVuJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0udGFza3MgPSByZXMuZGF0YS5tYXAoZnVuY3Rpb24odCl7XHJcblx0XHRcdFx0XHRyZXR1cm4gbmV3IFRhc2sodCk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIFRhc2socmF3VGFzaykge1xyXG5cdHRoaXMucmF3VGFzayA9IHJhd1Rhc2s7XHJcblxyXG5cdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHJhd1Rhc2spO1xyXG5cclxuXHR0aGlzLmRpc3BsYXlUaXRsZSA9IHJhd1Rhc2sudGl0bGUgfHwgcmF3VGFzay50eXBlO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zdG9yZXMnLCBbJ3VpLnJvdXRlciddKVxyXG4ucnVuKGFwcFJ1bik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdzdG9yZXMnLFxyXG4gICAgICAgICAgICB1cmw6ICcvc3RvcmVzJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0b3Jlc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3N0b3Jlcy9zdG9yZXMuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMixcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1tYXAtbWFya2VyJ11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycpXHJcbi5jb250cm9sbGVyKCdTdG9yZXNDb250cm9sbGVyJywgU3RvcmVzQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBTdG9yZXNDb250cm9sbGVyKGh0dHBDbGllbnQpe1xyXG5cdFxyXG5cdHZhciB2bSA9IHRoaXM7XHJcblxyXG5cdHZtLnN0b3JlcyA9IFtdO1xyXG5cdHZtLnNlbGVjdGVkID0gbnVsbDtcclxuXHR2bS50YXNrcyA9IFtdO1xyXG5cclxuXHR2bS5zZWxlY3QgPSBmdW5jdGlvbihzdG9yZSl7XHJcblx0XHR2bS5zZWxlY3RlZCA9IHN0b3JlO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZS5pZCArICcvdGFza3MnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnRhc2tzID0geC5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oeCl7XHJcblx0XHRcdHZtLnN0b3JlcyA9IHguZGF0YTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJywgWydhcHAuZGF0YSddKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycpXHJcbi5ydW4oY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoc2VjdGlvbk1hbmFnZXIpe1xyXG5cdHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFJvdXRlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Um91dGVzKCl7XHJcblx0cmV0dXJuIFt7XHJcblx0XHRuYW1lOiAnZW1wbG95ZWVzJyxcclxuXHRcdHVybDogJy9lbXBsb3llZXMnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0VtcGxveWVlc0NvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDQsXHJcblx0XHRcdGljb246IFsnZmEnLCAnZmEtdXNlcnMnXVxyXG5cdFx0fVxyXG5cdH1dO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnKVxyXG5cdC5jb250cm9sbGVyKCdFbXBsb3llZXNDb250cm9sbGVyJywgRW1wbG95ZWVzQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gRW1wbG95ZWVzQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIGV2ZW50U2VydmljZSwgaHR0cENsaWVudCkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlbXBsb3llZXM6IFtdXHJcblx0fSk7XHJcblxyXG5cdGV2ZW50U2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgb25TdG9yZUNoYW5nZWQpO1xyXG5cclxuXHRyZWZyZXNoRW1wbG95ZWVzKHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUpO1xyXG5cclxuXHRmdW5jdGlvbiBvblN0b3JlQ2hhbmdlZChlLCBzdG9yZSkge1xyXG5cdFx0cmVmcmVzaEVtcGxveWVlcyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoRW1wbG95ZWVzKHN0b3JlKSB7XHJcblx0XHRpZiAoIXN0b3JlKSB7XHJcblx0XHRcdHZtLmVtcGxveWVlcyA9IFtdO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy9lbXBsb3llZXMnLCB7Y2FjaGU6IGZhbHNlfSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uZW1wbG95ZWVzID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcsIFsndWkuYm9vdHN0cmFwJywgJ3VpLnJvdXRlciddKTsgIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4gICAgLnJ1bihhcHBSdW4pO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKFtcclxuXHJcbiAgICBdKTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbi5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBMb2dpbkNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvZ2luQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsICRzdGF0ZSl7XHJcblx0XHJcblx0dmFyIHZtID10aGlzO1xyXG5cdHZtLmxvZ2luID0ge1xyXG5cdFx0dXNlcm5hbWU6IFwiXCIsXHJcblx0XHRwYXNzd29yZDogXCJcIixcclxuXHRcdHJlbWVtYmVyTWU6IGZhbHNlXHJcblx0fTtcclxuXHJcblx0dGhpcy5idXN5ID0gZmFsc2U7XHJcblx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0dGhpcy5sb2dpbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLmJ1c3kgPSB0cnVlO1xyXG5cdFx0dGhpcy5tZXNzYWdlID0gXCJcIjtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UubG9naW4odm0ubG9naW4udXNlcm5hbWUsIHZtLmxvZ2luLnBhc3N3b3JkLCB2bS5sb2dpbi5yZW1lbWJlck1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXQpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XHJcblxyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdFx0dm0ubWVzc2FnZSA9IChleC5kYXRhICYmIGV4LmRhdGEubWVzc2FnZSkgfHwgXCJVbmFibGUgdG8gbG9nIGluXCI7XHJcblxyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0dm0uYnVzeSA9IGZhbHNlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0fTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcsIFsnYXBwLnNlY3Rpb25zJ10pXHJcbiAgICAucnVuKGFwcFJ1bik7XHJcbi8vLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xyXG4vLyAgICAgICAgdXJsOiAnJyxcclxuLy8gICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4vLyAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IHVpLXZpZXc+PC9kaXY+J1xyXG4vLyAgICB9KTtcclxuXHJcbi8vICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbi8vICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcicsXHJcbi8vICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbi8vICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnXHJcbi8vICAgIH0pO1xyXG5cclxuLy99KTtcclxuXHJcbmZ1bmN0aW9uIGFwcFJ1bihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIHNlY3Rpb25NYW5hZ2VyLnJlZ2lzdGVyKGdldFN0YXRlcygpKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpIHtcclxuICAgIHJldHVybiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBuYW1lOiAnZGFzaGJvYXJkJyxcclxuICAgICAgICAgICAgdXJsOiAnLycsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9kYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb3JkZXI6IDEsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBbJ2dseXBoaWNvbicsICdnbHlwaGljb24tc3RhdHMnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmRhc2hib2FyZCcpXHJcbiAgICAuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIERhc2hib2FyZENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIERhc2hib2FyZENvbnRyb2xsZXIoKSB7XHJcbiAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvIFdvcmxkXCI7XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcsWydhcHAuc29ja2V0J10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCwgJHEsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGdldEJ5SWQ6IF9nZXRCeUlkLFxyXG5cdFx0Z2V0QWxsRm9yU3RvcmU6IF9nZXRBbGxGb3JTdG9yZVxyXG5cdH1cclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gX2dldEJ5SWQoaWQpIHtcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldEFsbEZvclN0b3JlKHN0b3JlSWQpIHtcclxuXHJcblx0XHRpZiAoIXN0b3JlSWQpXHJcblx0XHRcdHJldHVybiAkcS5yZWplY3QoJ25vIHN0b3JlIGlkJyk7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZUlkICsgJy9jaGF0JylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGlkLCBtZXNzYWdlKSB7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvY2hhdC8nICsgaWQgKyAnL21lc3NhZ2VzJztcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCB7XHJcblx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpIHtcclxuXHJcblx0XHRzb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbihhLCBiKSB7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgaWQgPSBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlICYmIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUuaWQ7XHJcblx0XHRcdGlmKGlkKVxyXG5cdFx0XHRcdF9yZWdpc3RlcihpZCk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIHN0b3JlKSB7XHJcblx0XHRcdF9yZWdpc3RlcihzdG9yZS5pZCk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHNvY2tldC5vbignbmV3LWNoYXQnLCBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCduZXctY2hhdCcsIGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCduZXctY2hhdCcsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfcmVnaXN0ZXIoc3RvcmVJZCkge1xyXG5cdFx0Y29uc29sZS5sb2coJ3JlZ2lzdGVyOiAnICsgc3RvcmVJZCk7XHJcblx0XHRzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7XHJcblx0XHRcdGFwcDogJ3NvbG9tb24nLFxyXG5cdFx0XHRzdG9yZUlkOiBzdG9yZUlkXHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYXQnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRTdGF0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2NoYXQtbGlzdCcsXHJcblx0XHR1cmw6ICcvY2hhdHMnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0NoYXRMaXN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXQtbGlzdC5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDQsXHJcblx0XHRcdGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1jbG91ZCddXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihzdG9yZVNlcnZpY2UsIGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSwgY2hhdFNlcnZpY2UsICRyb290U2NvcGUsIHNlY3VyaXR5U2VydmljZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRjaGF0czogbnVsbCxcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGN1cnJlbnRDaGF0OiBudWxsLFxyXG5cdFx0c2VsZWN0Q2hhdDogX3NlbGVjdENoYXQsXHJcblx0XHRpc1NlbGVjdGVkOiBfaXNDaGF0U2VsZWN0ZWRcclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpIHtcclxuXHJcblx0XHRpZihzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIoKS5faWQgPT0gbXNnLnVzZXIpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR2YXIgY2hhdCA9IGdldENoYXQobXNnLmNoYXQpO1xyXG5cclxuXHRcdGlmICh2bS5jdXJyZW50Q2hhdCAmJiB2bS5jdXJyZW50Q2hhdC5faWQgPT0gbXNnLmNoYXQpIHtcclxuXHRcdFx0dm0uY3VycmVudENoYXQubWVzc2FnZXMucHVzaCh7XHJcblx0XHRcdFx0bWVzc2FnZTogbXNnLm1lc3NhZ2UsXHJcblx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0dXNlcjogbXNnLnVzZXJcclxuXHRcdFx0fSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjaGF0Lmhhc1VucmVhZCA9IHRydWU7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCduZXctY2hhdCcsIGZ1bmN0aW9uKGUsIG1zZyl7XHJcblx0XHR2bS5jaGF0cy51bnNoaWZ0KG1zZyk7XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoQ2hhdHMoc3RvcmUpO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaENoYXRzKHN0b3JlKSB7XHJcblx0XHRyZXR1cm4gY2hhdFNlcnZpY2UuZ2V0QWxsRm9yU3RvcmUoc3RvcmUuaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGNoYXRsaXN0KSB7XHJcblx0XHRcdFx0dm0uY2hhdHMgPSBjaGF0bGlzdDtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShjaGF0LCBtZXNzYWdlKSB7XHJcblx0XHRyZXR1cm4gY2hhdFNlcnZpY2Uuc2VuZE1lc3NhZ2UoY2hhdC5faWQsIG1lc3NhZ2UpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG1zZykge1xyXG5cdFx0XHRcdGNoYXQubWVzc2FnZXMucHVzaCh7XHJcblx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdHRpbWU6IG1zZy50aW1lLFxyXG5cdFx0XHRcdFx0dXNlcjogbXNnLnVzZXIsXHJcblx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXgpO1xyXG5cdFx0XHR9KS5maW5hbGx5KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNoYXQuY3VycmVudE1lc3NhZ2UgPSAnJztcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfc2VsZWN0Q2hhdChpZCkge1xyXG5cdFx0Y2hhdFNlcnZpY2UuZ2V0QnlJZChpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oY2hhdCkge1xyXG5cdFx0XHRcdHZtLmN1cnJlbnRDaGF0ID0gY2hhdDtcclxuXHRcdFx0XHQvL3ZtLmhhc1VucmVhZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRnZXRDaGF0KGNoYXQuX2lkKS5oYXNVbnJlYWQgPSBmYWxzZTtcclxuXHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2lzQ2hhdFNlbGVjdGVkKGNoYXQpe1xyXG5cclxuXHRcdGlmKCF2bS5jdXJyZW50Q2hhdClcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdHJldHVybiBjaGF0Ll9pZCA9PSB2bS5jdXJyZW50Q2hhdC5faWQ7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDaGF0KGlkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZtLmNoYXRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmICh2bS5jaGF0c1tpXS5faWQgPT0gaWQpXHJcblx0XHRcdFx0cmV0dXJuIHZtLmNoYXRzW2ldO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb250cm9sbGVyKCdBc2lkZUNvbnRyb2xsZXInLCBBc2lkZUNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEFzaWRlQ29udHJvbGxlcihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRzZWN0aW9uczogc2VjdGlvbk1hbmFnZXIuZ2V0TW9kdWxlcygpXHJcblx0fSk7XHJcblxyXG5cdC8vdm0uc2VjdGlvbnMgPSBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKCk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcbiAgICAuY29udHJvbGxlcignU2hlbGxDb250cm9sbGVyJywgU2hlbGxDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTaGVsbENvbnRyb2xsZXIoc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICAvL3ZhciB2bSA9IHRoaXM7XHJcbiAgICBcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbmZpZyhpbml0aWFsaXplU3RhdGVzKVxyXG5cdC5ydW4oZW5zdXJlQXV0aGVudGljYXRlZCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZW5zdXJlQXV0aGVudGljYXRlZCgkcm9vdFNjb3BlLCAkc3RhdGUsIHNlY3VyaXR5U2VydmljZSwgJHRpbWVvdXQpIHtcclxuXHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihlLCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcblxyXG5cdFx0aWYgKHRvU3RhdGUubmFtZSA9PT0gJ2xvZ2luJykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHVzZXIgPSBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIoKTtcclxuXHRcdGlmICh1c2VyKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0XHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gaW5pdGlhbGl6ZVN0YXRlcygkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcblxyXG5cdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcclxuXHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyXHJcblx0XHQuc3RhdGUoJ3Jvb3QnLCB7XHJcblx0XHRcdHVybDogJycsXHJcblx0XHRcdGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0XHR0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nLFxyXG5cdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpIHtcclxuXHJcblx0XHRcdFx0aWYgKCRyb290U2NvcGUuc2hvd1NwbGFzaCA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdC8vIEBuZ0luamVjdFxyXG5cdFx0XHRcdHVzZXI6IGZ1bmN0aW9uKHNlY3VyaXR5U2VydmljZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdG9uRW50ZXI6IC8qIEBuZ0luamVjdCAqLyBmdW5jdGlvbigkc3RhdGUsIHVzZXIpIHtcclxuXHRcdFx0XHQvLyBpZih1c2VyKVxyXG5cdFx0XHRcdC8vICAgICByZXR1cm4gJHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcclxuXHJcblx0XHRcdFx0Ly8gJHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdsb2dpbicsIHtcclxuXHRcdFx0Ly8gdXJsOiAnJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0xvZ2luQ29udHJvbGxlcicsXHJcblx0XHRcdGNvbnRyb2xsZXJBczogXCJ2bVwiLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9sb2dpbi9sb2dpbi5odG1sJ1xyXG5cdFx0fSlcclxuXHRcdC5zdGF0ZSgnYXBwLXJvb3QnLCB7XHJcblx0XHRcdC8vdXJsOiAnJyxcclxuXHRcdFx0cGFyZW50OiAncm9vdCcsXHJcblx0XHRcdGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnU2hlbGxDb250cm9sbGVyJyxcclxuXHRcdFx0dGVtcGxhdGVVcmw6ICdhcHAvbGF5b3V0L3NoZWxsLmh0bWwnLFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly91c2VyOiBmdW5jdGlvbigpXHJcblx0XHRcdH0sXHJcblx0XHRcdG9uRW50ZXI6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdTaGVsbENvbnRyb2xsZXIub25FbnRlcicpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIEhlYWRlckNvbnRyb2xsZXIoc2VjdXJpdHlTZXJ2aWNlLCBzdG9yZVNlcnZpY2UsIGV2ZW50U2VydmljZSwgdXRpbCkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRtZXNzYWdlOiBcIkhlbGxvIEhlYWRlclwiLFxyXG5cdFx0dXNlcjogc2VjdXJpdHlTZXJ2aWNlLmN1cnJlbnRVc2VyLFxyXG5cdFx0b3JnczogW10sXHJcblx0XHRzdG9yZXM6IFtdXHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwgJ29yZycsIHtcclxuXHRcdGdldDogZnVuY3Rpb24oKXtyZXR1cm4gc3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmc7fSxcclxuXHRcdHNldDogZnVuY3Rpb24odmFsdWUpe3N0b3JlU2VydmljZS5jdXJyZW50T3JnID0gdmFsdWU7fVxyXG5cdH0pO1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkodm0sICdzdG9yZScsIHtcclxuXHRcdGdldDogZnVuY3Rpb24oKXtyZXR1cm4gc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZTt9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSl7c3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSA9IHZhbHVlO31cclxuXHR9KTtcclxuXHJcblx0Ly91dGlsLmFkZFByb3BlcnR5KHZtLCAnb3JnJyk7XHJcblx0Ly91dGlsLmFkZFByb3BlcnR5KHZtLCAnc3RvcmUnKTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRmdW5jdGlvbiBpbml0KCkge1xyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHgpIHtcclxuXHRcdFx0XHR2bS51c2VyID0geDtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLm9uKCd1c2VyQ2hhbmdlZCcsIGhhbmRsZVVzZXJDaGFuZ2VkKTtcclxuXHJcblx0XHRzdG9yZVNlcnZpY2UuZ2V0T3JncygpXHJcblx0XHQudGhlbihmdW5jdGlvbihvcmdzKXtcclxuXHRcdFx0dm0ub3JncyA9IG9yZ3M7XHJcblx0XHRcdFxyXG5cdFx0XHRpZighc3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcpXHJcblx0XHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2bS5vcmdzWzBdO1xyXG5cclxuXHRcdFx0cmVmcmVzaFN0b3JlcyhzdG9yZVNlcnZpY2UuY3VycmVudE9yZyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRldmVudFNlcnZpY2Uub24oJ29yZ0NoYW5nZWQnLCBmdW5jdGlvbihlLCBvcmcpe1xyXG5cdFx0XHQvL3ZtLm9yZyA9IG9yZztcclxuXHRcdFx0cmVmcmVzaFN0b3JlcyhvcmcpO1xyXG5cdFx0XHRcclxuXHRcdH0pO1xyXG5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hTdG9yZXMob3JnKXtcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0U3RvcmVzKG9yZylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmVzKXtcclxuXHRcdFx0XHR2bS5zdG9yZXMgPSBzdG9yZXM7XHJcblxyXG5cdFx0XHRcdGlmKCFzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKVxyXG5cdFx0XHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSA9IHZtLnN0b3Jlc1swXTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVVc2VyQ2hhbmdlZCh1c2VyKSB7XHJcblx0XHR2bS51c2VyID0gdXNlcjtcclxuXHR9XHJcbn0iLCIoZnVuY3Rpb24gKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG59KCkpOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29uZmlnJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=