(function () {
    'use strict';
    angular.module('app.socket', [
        'btford.socket-io',
        'symbiote.common'
    ]);
}());
(function () {
    'use strict';
    angular.module('app.socket').factory('socketBuilder', ["socketFactory", "env", "storageService", "storeService", "securityService", function (socketFactory, env, storageService, storeService, securityService) {
        var builder = function (namespace) {
            namespace = namespace || '';
            var device = storageService.get('device-id');
            // if this is undefined then generate a new device key
            // should be seperated into a different service.
            var myIoSocket = io.connect(env.apiRoot + namespace, { query: 'device=' + device });
            var socket = socketFactory({ ioSocket: myIoSocket });
            function register() {
                var user = securityService.currentUser();
                var details = {
                    storeId: storeService.currentStore && storeService.currentStore.id,
                    userId: user && user._id,
                    deviceId: device,
                    app: 'solomon'
                };
                if (details.storeId && (details.userId || details.deviceId)) {
                    console.log('register', details);
                    socket.emit('register', details);
                }
            }
            socket.on('connect', register);
            storeService.on('storeChanged', register);
            securityService.on('userChanged', register);
            return socket;
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
    angular.module('solomon').filter('fromNow', fromNowFilter);
    function fromNowFilter() {
        return function (date) {
            return moment(date).fromNow();
        };
    }
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
            // socket.on('connect', function(a, b) {
            // 	var id = storeService.currentStore && storeService.currentStore.id;
            // 	if(id)
            // 		_register(id);
            // });
            // storeService.on('storeChanged', function(e, store) {
            // 	_register(store.id);
            // });
            socket.on('message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
            socket.on('new-chat', function (data) {
                console.log('new-chat', data);
                $rootScope.$emit('new-chat', data);
            });
        }    // function _register(storeId) {
             // 	console.log('register: ' + storeId);
             // 	socket.emit('register', {
             // 		app: 'solomon',
             // 		storeId: storeId
             // 	});
             // }
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
        if (storeService.currentStore)
            onStoreChanged(null, storeService.currentStore);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9zb2NrZXQvc29ja2V0Lm1vZHVsZS5qcyIsImNvbW1vbi9zb2NrZXQvc29ja2V0QnVpbGRlci5qcyIsImNvbW1vbi9zZWN1cml0eS9zZWN1cml0eVNlcnZpY2UuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tb2R1bGUuanMiLCJjb21tb24vcm91dGluZy9zZWN0aW9ucy5tYW5hZ2VyLmpzIiwiY29tbW9uL2xvZ2dpbmcvbG9nZ2VyLm1vZHVsZS5qcyIsImNvbW1vbi9sb2dnaW5nL2xvZ2dlci5zZXJ2aWNlLmpzIiwic29sb21vbi5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3VpU3RhdGUuanMiLCJjb21tb24vZmlsdGVycy9mcm9tTm93LmZpbHRlci5qcyIsImNvbW1vbi9kYXRhL2RhdGEubW9kdWxlLmpzIiwiY29tbW9uL2RhdGEvdXRpbC5qcyIsImNvbW1vbi9kYXRhL3N0b3JlU2VydmljZS5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tzLm1vZHVsZS5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tzLnJvdXRlcy5qcyIsImFyZWFzL3Rhc2tzL3Rhc2tsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9zdG9yZXMvc3RvcmVzLm1vZHVsZS5qcyIsImFyZWFzL3N0b3Jlcy9TdG9yZXNDb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5tb2R1bGUuanMiLCJhcmVhcy9sb2dpbi9sb2dpbi5jb250cm9sbGVyLmpzIiwiYXJlYXMvZW1wbG95ZWVzL2VtcGxveWVlcy5tb2R1bGUuanMiLCJhcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLnJvdXRlcy5qcyIsImFyZWFzL2VtcGxveWVlcy9lbXBsb3llZXMuY29udHJvbGxlci5qcyIsImFyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQubW9kdWxlLmpzIiwiYXJlYXMvZGFzaGJvYXJkL2Rhc2hib2FyZC5jb250cm9sbGVyLmpzIiwiYXJlYXMvY2hhdC9jaGF0Lm1vZHVsZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnJvdXRlcy5qcyIsImFyZWFzL2NoYXQvY2hhdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvYXNpZGUvYXNpZGUuY29udHJvbGxlci5qcyIsImxheW91dC9zaGVsbC5jb250cm9sbGVyLmpzIiwibGF5b3V0L2xheW91dC5zdGF0ZXMuanMiLCJsYXlvdXQvaGVhZGVyLmNvbnRyb2xsZXIuanMiLCJjb25maWcvZW52aXJvbm1lbnQuanMiLCJjb25maWcvY29uZmlnLm1vZHVsZS5qcyIsImVudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5Iiwic29ja2V0RmFjdG9yeSIsImVudiIsInN0b3JhZ2VTZXJ2aWNlIiwic3RvcmVTZXJ2aWNlIiwic2VjdXJpdHlTZXJ2aWNlIiwiYnVpbGRlciIsIm5hbWVzcGFjZSIsImRldmljZSIsImdldCIsIm15SW9Tb2NrZXQiLCJpbyIsImNvbm5lY3QiLCJhcGlSb290IiwicXVlcnkiLCJzb2NrZXQiLCJpb1NvY2tldCIsInJlZ2lzdGVyIiwidXNlciIsImN1cnJlbnRVc2VyIiwiZGV0YWlscyIsInN0b3JlSWQiLCJjdXJyZW50U3RvcmUiLCJpZCIsInVzZXJJZCIsIl9pZCIsImRldmljZUlkIiwiYXBwIiwiY29uc29sZSIsImxvZyIsImVtaXQiLCJvbiIsInNvY2tldEJ1aWxkZXIiLCIkc3RhdGUiLCJodHRwQ2xpZW50IiwiJHEiLCJfY3VycmVudFVzZXIiLCJfbGlzdGVuZXJzIiwic2VydmljZSIsInJlcXVlc3RDdXJyZW50VXNlciIsIl9yZXF1ZXN0Q3VycmVudFVzZXIiLCJhZGRMaXN0ZW5lciIsImxvZ2luIiwiX2xvZ2luIiwibG9nb3V0IiwiX2xvZ291dCIsImV2ZW50TmFtZSIsImxpc3RlbmVyIiwicHVzaCIsImZpcmVFdmVudCIsImFyZ3MiLCJoYW5kbGVyIiwiZXZlbnRBcmdzIiwic3BsaWNlIiwiY2FsbCIsImZvckVhY2giLCJjYiIsInRva2VuIiwid2hlbiIsIm9wdGlvbnMiLCJjYWNoZSIsImF1dGgiLCJkZWZlciIsInRoZW4iLCJyZXNwb25zZSIsImRhdGEiLCJyZXNvbHZlIiwiY2F0Y2giLCJyZXMiLCJzdGF0dXMiLCJyZWplY3QiLCJwcm9taXNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInBlcnNpc3QiLCJ0ZXh0IiwiYnRvYSIsInBvc3QiLCJhdXRoX3Rva2VuIiwic2V0IiwicmVtb3ZlIiwiZ28iLCJfc2V0VXNlciIsInJ1biIsImRlYnVnUm91dGVzIiwiJHJvb3RTY29wZSIsIiRzdGF0ZVBhcmFtcyIsIiRvbiIsImV2ZW50IiwidG9TdGF0ZSIsInRvUGFyYW1zIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImFyZ3VtZW50cyIsInVuZm91bmRTdGF0ZSIsInRvIiwicHJvdmlkZXIiLCJzZWN0aW9uTWFuYWdlclByb3ZpZGVyIiwiJHN0YXRlUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImNvbmZpZyIsInJlc29sdmVBbHdheXMiLCJjb25maWd1cmUiLCJvcHRzIiwiZXh0ZW5kIiwiaHRtbDVNb2RlIiwiJGdldCIsIlNlY3Rpb25NYW5hZ2VyU2VydmljZSIsIl9zZWN0aW9ucyIsImdldFNlY3Rpb25zIiwicmVnaXN0ZXJTZWN0aW9ucyIsImdldE1vZHVsZXMiLCJzZWN0aW9ucyIsInN0YXRlIiwicGFyZW50IiwidW5kZWZpbmVkIiwiZmlsdGVyIiwieCIsInNldHRpbmdzIiwibG9nZ2VyU2VydmljZSIsIiRsb2ciLCJpbmZvIiwid2FybmluZyIsImVycm9yIiwibWVzc2FnZSIsImh0dHBDbGllbnRQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCJiYXNlVXJpIiwiZGVmYXVsdHMiLCJ1c2VYRG9tYWluIiwid2l0aENyZWRlbnRpYWxzIiwiZGlyZWN0aXZlIiwidWlTdGF0ZSIsInJlc3RyaWN0IiwibGluayIsInJlcXVpcmUiLCJzY29wZSIsImVsZW1lbnQiLCJhdHRycyIsInVpU3JlZkFjdGl2ZSIsIm5hbWUiLCIkZXZhbCIsInBhcmFtcyIsInVpU3RhdGVQYXJhbXMiLCJ1cmwiLCJocmVmIiwiJHNldCIsInMiLCIkJHNldFN0YXRlSW5mbyIsImZyb21Ob3dGaWx0ZXIiLCJkYXRlIiwibW9tZW50IiwiZnJvbU5vdyIsIlV0aWxTZXJ2aWNlIiwiZXZlbnRTZXJ2aWNlIiwiYWRkUHJvcGVydHkiLCJ1dWlkIiwiZ2VuZXJhdGVVVUlEIiwib2JqIiwiZ2V0dGVyIiwic2V0dGVyIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJjcmVhdGVHZXR0ZXIiLCJjcmVhdGVTZXR0ZXIiLCJmaWVsZCIsInZhbHVlIiwib2xkVmFsdWUiLCJyYWlzZSIsInByb3BlcnR5Iiwib3JpZ2luYWxWYWx1ZSIsImQiLCJEYXRlIiwiZ2V0VGltZSIsInJlcGxhY2UiLCJjIiwiciIsIk1hdGgiLCJyYW5kb20iLCJmbG9vciIsInRvU3RyaW5nIiwiU3RvcmVTZXJ2aWNlIiwiX2N1cnJlbnRTdG9yZSIsIl9jdXJyZW50T3JnIiwiZ2V0T3JncyIsImdldFN0b3JlcyIsIl9saXN0ZW4iLCJlbnVtZXJhYmxlIiwiZ2V0X2N1cnJlbnRPcmciLCJzZXRfY3VycmVudE9yZyIsImdldF9jdXJyZW50U3RvcmUiLCJzZXRfY3VycmVudFN0b3JlIiwib3JnSWQiLCJjdXJyZW50T3JnIiwiXyIsImZpbmQiLCJvcmciLCJhcHBSdW4iLCJzZWN0aW9uTWFuYWdlciIsImdldFN0YXRlcyIsImNvbnRyb2xsZXIiLCJjb250cm9sbGVyQXMiLCJ0ZW1wbGF0ZVVybCIsIm9yZGVyIiwiaWNvbiIsImRpc3BsYXlOYW1lIiwiVGFza0xpc3RDb250cm9sbGVyIiwidm0iLCJ0YXNrcyIsInN0YXRzIiwib25TdG9yZUNoYW5nZWQiLCJyZWZyZXNoVGFza3MiLCJyZWZyZXNoU3RhdHMiLCJlIiwic3RvcmUiLCJzb3J0QnkiLCJpdGVtIiwiaW5kZXgiLCJpbmRleE9mIiwibWFwIiwidCIsIlRhc2siLCJyYXdUYXNrIiwiZGlzcGxheVRpdGxlIiwidGl0bGUiLCJ0eXBlIiwiU3RvcmVzQ29udHJvbGxlciIsInN0b3JlcyIsInNlbGVjdGVkIiwic2VsZWN0IiwiaW5pdCIsIkxvZ2luQ29udHJvbGxlciIsInJlbWVtYmVyTWUiLCJidXN5IiwicmV0IiwiZXgiLCJmaW5hbGx5IiwiY29uZmlndXJlUm91dGVzIiwiZ2V0Um91dGVzIiwiRW1wbG95ZWVzQ29udHJvbGxlciIsImVtcGxveWVlcyIsInJlZnJlc2hFbXBsb3llZXMiLCJEYXNoYm9hcmRDb250cm9sbGVyIiwiQ2hhdEZhY3RvcnkiLCJzZW5kTWVzc2FnZSIsImdldEJ5SWQiLCJfZ2V0QnlJZCIsImdldEFsbEZvclN0b3JlIiwiX2dldEFsbEZvclN0b3JlIiwiJGVtaXQiLCJDaGF0TGlzdENvbnRyb2xsZXIiLCJjaGF0U2VydmljZSIsImNoYXRzIiwiY3VycmVudENoYXQiLCJzZWxlY3RDaGF0IiwiX3NlbGVjdENoYXQiLCJpc1NlbGVjdGVkIiwiX2lzQ2hhdFNlbGVjdGVkIiwibXNnIiwiY2hhdCIsImdldENoYXQiLCJtZXNzYWdlcyIsInRpbWUiLCJoYXNVbnJlYWQiLCJ1bnNoaWZ0IiwicmVmcmVzaENoYXRzIiwiY2hhdGxpc3QiLCJzZW50IiwiY3VycmVudE1lc3NhZ2UiLCJpIiwibGVuZ3RoIiwiQXNpZGVDb250cm9sbGVyIiwiU2hlbGxDb250cm9sbGVyIiwiaW5pdGlhbGl6ZVN0YXRlcyIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsInNob3dTcGxhc2giLCJwcmV2ZW50RGVmYXVsdCIsInUiLCJ0YXJnZXRTdGF0ZSIsIndhaXRpbmdGb3JWaWV3IiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwiYWJzdHJhY3QiLCJ0ZW1wbGF0ZSIsIiRzY29wZSIsIm9uRW50ZXIiLCJIZWFkZXJDb250cm9sbGVyIiwidXRpbCIsIm9yZ3MiLCJoYW5kbGVVc2VyQ2hhbmdlZCIsInJlZnJlc2hTdG9yZXMiLCJjb25zdGFudCJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxZQUFZO0lBQ1Q7SUFESkEs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QzVCckksS0FBSyxVQUFTb0ssUUFBTztnQkFDckJwQixHQUFHb0IsU0FBU0E7Z0JBRVosSUFBRyxDQUFDL04sYUFBYWtCO29CQUNoQmxCLGFBQWFrQixlQUFleUwsR0FBR29CLE9BQU87OztRQUkxQyxTQUFTK0Qsa0JBQWtCaFIsTUFBTTtZQUNoQzZMLEdBQUc3TCxPQUFPQTs7OztLQVJQO0FDekRMLENBQUMsWUFBWTtJQUNUO0tBQ0M7QUNGTCxDQUFDLFlBQVk7SUFDVDtJQURKcEIsUUFBUUMsT0FBTyxjQUFjO0tBR3hCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxjQUNkcVMsU0FBUyxPQUFPLEVBQ2J2UixTQUFTO0tBQ1IiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2FwcC5zb2NrZXQnLFtcclxuXHQnYnRmb3JkLnNvY2tldC1pbycsXHJcblx0J3N5bWJpb3RlLmNvbW1vbidcclxuXHRdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNvY2tldCcpXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0QnVpbGRlcicsIGZ1bmN0aW9uIChzb2NrZXRGYWN0b3J5LCBlbnYsIHN0b3JhZ2VTZXJ2aWNlLCBzdG9yZVNlcnZpY2UsIHNlY3VyaXR5U2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2UgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZS1pZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyB1bmRlZmluZWQgdGhlbiBnZW5lcmF0ZSBhIG5ldyBkZXZpY2Uga2V5XHJcbiAgICAgICAgICAgIC8vIHNob3VsZCBiZSBzZXBlcmF0ZWQgaW50byBhIGRpZmZlcmVudCBzZXJ2aWNlLlxyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KGVudi5hcGlSb290ICsgbmFtZXNwYWNlLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHVzZXIgPSBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZGV0YWlscyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9yZUlkOiBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlICYmIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcklkOiB1c2VyICYmIHVzZXIuX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldmljZUlkOiBkZXZpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwOiAnc29sb21vbidcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRldGFpbHMuc3RvcmVJZCAmJiAoZGV0YWlscy51c2VySWQgfHwgZGV0YWlscy5kZXZpY2VJZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVnaXN0ZXInLCBkZXRhaWxzKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCBkZXRhaWxzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc29ja2V0Lm9uKCdjb25uZWN0JywgcmVnaXN0ZXIpO1xyXG5cclxuICAgICAgICAgICAgc3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCByZWdpc3Rlcik7XHJcbiAgICAgICAgICAgIHNlY3VyaXR5U2VydmljZS5vbigndXNlckNoYW5nZWQnLCByZWdpc3Rlcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc29ja2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0JywgZnVuY3Rpb24oc29ja2V0QnVpbGRlcil7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3VyaXR5JywgW10pXHJcbiAgICAuZmFjdG9yeSgnc2VjdXJpdHlTZXJ2aWNlJywgc2VjdXJpdHlTZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBzZWN1cml0eVNlcnZpY2Uoc3RvcmFnZVNlcnZpY2UsICRzdGF0ZSwgaHR0cENsaWVudCwgJHEpIHtcclxuXHJcbiAgICB2YXIgX2N1cnJlbnRVc2VyID0gbnVsbDtcclxuICAgIHZhciBfbGlzdGVuZXJzID0ge307XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgY3VycmVudFVzZXI6IGZ1bmN0aW9uKCl7cmV0dXJuIF9jdXJyZW50VXNlcjt9LFxyXG4gICAgICAgIHJlcXVlc3RDdXJyZW50VXNlcjogX3JlcXVlc3RDdXJyZW50VXNlcixcclxuXHJcbiAgICAgICAgb246IGFkZExpc3RlbmVyLFxyXG5cclxuICAgICAgICBsb2dpbjogX2xvZ2luLFxyXG4gICAgICAgIGxvZ291dDogX2xvZ291dFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKXtcclxuICAgICAgICBpZighX2xpc3RlbmVyc1tldmVudE5hbWVdKVxyXG4gICAgICAgICAgICBfbGlzdGVuZXJzW2V2ZW50TmFtZV0gPSBbXTtcclxuICAgICAgICBfbGlzdGVuZXJzW2V2ZW50TmFtZV0ucHVzaChsaXN0ZW5lcik7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBmaXJlRXZlbnQoZXZlbnROYW1lLCBhcmdzKXtcclxuICAgICAgICB2YXIgaGFuZGxlciA9IF9saXN0ZW5lcnNbZXZlbnROYW1lXTtcclxuICAgICAgICBpZighaGFuZGxlcikgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIGV2ZW50QXJncyA9IFtdLnNwbGljZS5jYWxsKGFyZ3MsIDEpO1xyXG4gICAgICAgIGhhbmRsZXIuZm9yRWFjaChmdW5jdGlvbihjYil7XHJcbiAgICAgICAgICAgIGNiKGV2ZW50QXJncyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3JlcXVlc3RDdXJyZW50VXNlcih0b2tlbikge1xyXG5cclxuICAgICAgICBpZiAoX2N1cnJlbnRVc2VyKVxyXG4gICAgICAgICAgICByZXR1cm4gJHEud2hlbihfY3VycmVudFVzZXIpO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHRva2VuKVxyXG4gICAgICAgICAgICBvcHRpb25zLmF1dGggPSB7XHJcbiAgICAgICAgICAgICAgICAnQmVhcmVyJzogdG9rZW5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKTtcclxuXHJcbiAgICAgICAgaHR0cENsaWVudC5nZXQoJy90b2tlbnMvY3VycmVudCcsIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgX2N1cnJlbnRVc2VyID0gcmVzcG9uc2UuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblxyXG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihyZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVyLnJlc29sdmUobnVsbCk7XHJcbiAgICAgICAgICAgICAgICBkZWZlci5yZWplY3QocmVzKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9sb2dpbih1c2VybmFtZSwgcGFzc3dvcmQsIHBlcnNpc3QpIHtcclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSBidG9hKHVzZXJuYW1lICsgXCI6XCIgKyBwYXNzd29yZCk7XHJcbiAgICAgICAgdmFyIHRva2VuID0gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQucG9zdCgnL3Rva2VucycsIG51bGwsIHtcclxuICAgICAgICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgICAgICAgICAnQmFzaWMnOiB0ZXh0XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG4gICAgICAgICAgICAgICAgdG9rZW4gPSByZXMuZGF0YS5hdXRoX3Rva2VuO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBfcmVxdWVzdEN1cnJlbnRVc2VyKHRva2VuKTtcclxuICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlU2VydmljZS5zZXQoXCJhdXRoLXRva2VuXCIsIHRva2VuLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfbG9nb3V0KCkge1xyXG4gICAgICAgIHN0b3JhZ2VTZXJ2aWNlLnJlbW92ZSgndG9rZW4nKTtcclxuICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3NldFVzZXIodXNlcil7XHJcbiAgICAgICAgX2N1cnJlbnRVc2VyID0gdXNlcjtcclxuICAgICAgICBmaXJlRXZlbnQoJ3VzZXJDaGFuZ2VkJywgdXNlcik7XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuc2VjdGlvbnMnLCBbJ3VpLnJvdXRlciddKTtcclxuXHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJykucnVuKGRlYnVnUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBkZWJ1Z1JvdXRlcygkcm9vdFNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcykge1xyXG4gICAgLy8gQ3JlZGl0czogQWRhbSdzIGFuc3dlciBpbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMDc4NjI2Mi82OTM2MlxyXG4gICAgLy8gUGFzdGUgdGhpcyBpbiBicm93c2VyJ3MgY29uc29sZVxyXG5cclxuICAgIC8vdmFyICRyb290U2NvcGUgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIlt1aS12aWV3XVwiKVswXSkuaW5qZWN0b3IoKS5nZXQoJyRyb290U2NvcGUnKTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRzdGF0ZSA9ICRzdGF0ZTtcclxuICAgICRyb290U2NvcGUuJHN0YXRlUGFyYW1zID0gJHN0YXRlUGFyYW1zO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VFcnJvcicsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VFcnJvciAtIGZpcmVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzIGR1cmluZyB0cmFuc2l0aW9uLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGFyZ3VtZW50cyk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCckc3RhdGVOb3RGb3VuZCAnICsgdW5mb3VuZFN0YXRlLnRvICsgJyAgLSBmaXJlZCB3aGVuIGEgc3RhdGUgY2Fubm90IGJlIGZvdW5kIGJ5IGl0cyBuYW1lLicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZSwgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCckc3RhdGVDaGFuZ2VTdGFydCB0byAnICsgdG9TdGF0ZS50byArICctIGZpcmVkIHdoZW4gdGhlIHRyYW5zaXRpb24gYmVnaW5zLiB0b1N0YXRlLHRvUGFyYW1zIDogXFxuJywgdG9TdGF0ZSwgdG9QYXJhbXMpO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgLy8gJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHN0YXRlQ2hhbmdlU3VjY2VzcyB0byAnICsgdG9TdGF0ZS5uYW1lICsgJy0gZmlyZWQgb25jZSB0aGUgc3RhdGUgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZS4nKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vICRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZygnJHZpZXdDb250ZW50TG9hZGVkIC0gZmlyZWQgYWZ0ZXIgZG9tIHJlbmRlcmVkJywgZXZlbnQpO1xyXG4gICAgLy8gfSk7XHJcblxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLnNlY3Rpb25zJylcclxuXHQucHJvdmlkZXIoJ3NlY3Rpb25NYW5hZ2VyJywgc2VjdGlvbk1hbmFnZXJQcm92aWRlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gc2VjdGlvbk1hbmFnZXJQcm92aWRlcigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcclxuXHJcblx0dmFyIGNvbmZpZyA9IHtcclxuXHRcdHJlc29sdmVBbHdheXM6IHt9XHJcblx0fTtcclxuXHJcblx0dGhpcy5jb25maWd1cmUgPSBmdW5jdGlvbiAob3B0cykge1xyXG5cdFx0YW5ndWxhci5leHRlbmQoY29uZmlnLCBvcHRzKTtcclxuXHR9O1xyXG5cclxuXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XHJcblxyXG5cclxuXHR0aGlzLiRnZXQgPSBTZWN0aW9uTWFuYWdlclNlcnZpY2U7XHJcblxyXG5cdC8vIEBuZ0luamVjdFxyXG5cdGZ1bmN0aW9uIFNlY3Rpb25NYW5hZ2VyU2VydmljZSgkcm9vdFNjb3BlLCAkc3RhdGUpIHtcclxuXHJcblx0ICAgIHZhciBfc2VjdGlvbnMgPSBbXTtcclxuXHJcblx0XHR2YXIgc2VydmljZSA9IHtcclxuXHRcdFx0Z2V0U2VjdGlvbnM6IGdldFNlY3Rpb25zLFxyXG5cdFx0XHRyZWdpc3RlcjogcmVnaXN0ZXJTZWN0aW9ucyxcclxuICAgICAgICAgICAgZ2V0TW9kdWxlczogZ2V0TW9kdWxlc1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWdpc3RlclNlY3Rpb25zKHNlY3Rpb25zKSB7XHJcblx0XHRcdHNlY3Rpb25zLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlKSB7XHJcblxyXG5cdFx0XHRcdGlmKHN0YXRlLnBhcmVudCA9PT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRcdFx0c3RhdGUucGFyZW50ID0gJ2FwcC1yb290JztcclxuXHJcblx0XHRcdFx0c3RhdGUucmVzb2x2ZSA9XHJcblx0XHRcdFx0XHRhbmd1bGFyLmV4dGVuZChzdGF0ZS5yZXNvbHZlIHx8IHt9LCBjb25maWcucmVzb2x2ZUFsd2F5cyk7XHJcblx0XHRcdFx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoc3RhdGUpO1xyXG5cdFx0XHRcdF9zZWN0aW9ucy5wdXNoKHN0YXRlKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlcygpIHtcclxuXHRcdCAgICByZXR1cm4gJHN0YXRlLmdldCgpLmZpbHRlcihmdW5jdGlvbiAoeCkge1xyXG5cdFx0ICAgICAgICByZXR1cm4geC5zZXR0aW5ncyAmJiB4LnNldHRpbmdzLm1vZHVsZTtcclxuXHRcdCAgICB9KTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnZXRTZWN0aW9ucygpIHtcclxuXHRcdCAgICAvL3JldHVybiAkc3RhdGUuZ2V0KCk7XHJcblx0XHQgICAgcmV0dXJuIF9zZWN0aW9ucztcclxuXHRcdH1cclxuXHJcblx0fVxyXG59XHJcbiIsIlxyXG5hbmd1bGFyLm1vZHVsZSgnYXBwLmxvZ2dpbmcnLCBbXSk7IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAubG9nZ2luZycpXHJcbiAgICAuc2VydmljZSgnbG9nZ2VyJywgbG9nZ2VyU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gbG9nZ2VyU2VydmljZSgkbG9nKSB7XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgaW5mbzogaW5mbyxcclxuICAgICAgICB3YXJuaW5nOiB3YXJuaW5nLFxyXG4gICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICBsb2c6ICRsb2dcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGluZm8obWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuaW5mbygnSW5mbzogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHdhcm5pbmcobWVzc2FnZSwgZGF0YSkge1xyXG4gICAgICAgICRsb2cuaW5mbygnV0FSTklORzogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgICAgICAkbG9nLmVycm9yKCdFUlJPUjogJyArIG1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgfVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nLFxyXG4gICAgW1xyXG4gICAgICAgICdhcHAuY29uZmlnJyxcclxuICAgICAgICAnYXBwLmxheW91dCcsXHJcbiAgICAgICAgJ2FwcC5sb2dnaW5nJyxcclxuICAgICAgICAnYXBwLnNlY3Rpb25zJyxcclxuICAgICAgICAnYXBwLnNlY3VyaXR5JyxcclxuICAgICAgICAnYXBwLmRhdGEnLFxyXG4gICAgICAgICdhcHAuc29ja2V0JyxcclxuICAgICAgICAnc29sb21vbi5wYXJ0aWFscycsXHJcbiAgICAgICAgJ2FwcC5kYXNoYm9hcmQnLFxyXG4gICAgICAgICdhcHAuc3RvcmVzJyxcclxuICAgICAgICAnYXBwLnRhc2tzJyxcclxuICAgICAgICAnYXBwLmNoYXQnLFxyXG4gICAgICAgICdhcHAuZW1wbG95ZWVzJyxcclxuICAgICAgICAnc3ltYmlvdGUuY29tbW9uJyxcclxuICAgICAgICAnbmdBbmltYXRlJ1xyXG4gICAgXSk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnc29sb21vbicpXHJcbi5jb25maWcoY29uZmlnKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWcoaHR0cENsaWVudFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKXtcclxuXHRodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCI7XHJcblxyXG4gICAgICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMudXNlWERvbWFpbiA9IHRydWU7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLndpdGhDcmVkZW50aWFscyA9IHRydWU7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmNhY2hlID0gdHJ1ZTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdzb2xvbW9uJylcclxuXHQuZGlyZWN0aXZlKCd1aVN0YXRlJywgdWlTdGF0ZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gdWlTdGF0ZSgkc3RhdGUpIHtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnQScsXHJcblx0XHRsaW5rOiBsaW5rLFxyXG5cdFx0cmVxdWlyZTogJz91aVNyZWZBY3RpdmUnXHJcblx0fTtcclxuIFxyXG5cdGZ1bmN0aW9uIGxpbmsoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCB1aVNyZWZBY3RpdmUpIHtcclxuXHJcblx0XHR2YXIgbmFtZSA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGUpO1xyXG5cdFx0dmFyIHBhcmFtcyA9IHNjb3BlLiRldmFsKGF0dHJzLnVpU3RhdGVQYXJhbXMpO1xyXG5cclxuXHRcdHZhciB1cmwgPSAkc3RhdGUuaHJlZihuYW1lLCBwYXJhbXMpO1xyXG5cclxuXHRcdGlmKHVybCA9PT0gXCJcIilcclxuXHRcdFx0dXJsID0gXCIvXCI7XHJcblxyXG5cdFx0YXR0cnMuJHNldCgnaHJlZicsIHVybCk7XHJcblxyXG5cdFx0dmFyIHMgPSAkc3RhdGUuZ2V0KG5hbWUpO1xyXG5cclxuXHRcdGlmKCF1aVNyZWZBY3RpdmUpXHJcblx0XHRcdHJldHVybjtcclxuXHRcdHVpU3JlZkFjdGl2ZS4kJHNldFN0YXRlSW5mbyhzLCB7fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3NvbG9tb24nKVxyXG4uZmlsdGVyKCdmcm9tTm93JywgZnJvbU5vd0ZpbHRlcik7XHJcblxyXG5mdW5jdGlvbiBmcm9tTm93RmlsdGVyKCl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uKGRhdGUpe1xyXG5cdFx0cmV0dXJuIG1vbWVudChkYXRlKS5mcm9tTm93KCk7XHJcblx0fTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGF0YScsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhdGEnKVxyXG5cdC5mYWN0b3J5KCd1dGlsJywgVXRpbFNlcnZpY2UpO1xyXG5cclxuZnVuY3Rpb24gVXRpbFNlcnZpY2UoZXZlbnRTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0YWRkUHJvcGVydHk6IGFkZFByb3BlcnR5LFxyXG5cdFx0dXVpZDogZ2VuZXJhdGVVVUlEXHJcblx0fTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIGFkZFByb3BlcnR5KG9iaiwgbmFtZSwgZ2V0dGVyLCBzZXR0ZXIpIHtcclxuXHJcblxyXG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwge1xyXG5cdFx0XHRnZXQ6IGdldHRlciB8fCBjcmVhdGVHZXR0ZXIob2JqLCBuYW1lKSxcclxuXHRcdFx0c2V0OiBzZXR0ZXIgfHwgY3JlYXRlU2V0dGVyKG9iaiwgbmFtZSlcclxuXHRcdH0pO1xyXG5cclxuXHRcdGZ1bmN0aW9uIGNyZWF0ZUdldHRlcihvYmosIG5hbWUpIHtcclxuXHRcdFx0dmFyIGZpZWxkID0gJ18nICsgbmFtZTtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBvYmpbZmllbGRdO1xyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihvYmosIG5hbWUpIHtcclxuXHRcdFx0dmFyIGZpZWxkID0gJ18nICsgbmFtZTtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblxyXG5cdFx0XHRcdHZhciBvbGRWYWx1ZSA9IG9ialtmaWVsZF07XHJcblxyXG5cdFx0XHRcdG9ialtmaWVsZF0gPSB2YWx1ZTtcclxuXHRcdFx0XHRldmVudFNlcnZpY2UucmFpc2UobmFtZSArICdDaGFuZ2VkJywge1xyXG5cdFx0XHRcdFx0b2JqOiBvYmosXHJcblx0XHRcdFx0XHRwcm9wZXJ0eTogbmFtZSxcclxuXHRcdFx0XHRcdHZhbHVlOiB2YWx1ZSxcclxuXHRcdFx0XHRcdG9yaWdpbmFsVmFsdWU6IG9sZFZhbHVlXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XHJcblx0XHR2YXIgZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cdFx0dmFyIHV1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcclxuXHRcdFx0dmFyIHIgPSAoZCArIE1hdGgucmFuZG9tKCkgKiAxNikgJSAxNiB8IDA7XHJcblx0XHRcdGQgPSBNYXRoLmZsb29yKGQgLyAxNik7XHJcblx0XHRcdHJldHVybiAoYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpKS50b1N0cmluZygxNik7XHJcblx0XHR9KTtcclxuXHRcdHJldHVybiB1dWlkO1xyXG5cdH07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmRhdGEnKVxyXG5cdC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFN0b3JlU2VydmljZShodHRwQ2xpZW50LCBldmVudFNlcnZpY2UsICRxLCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuXHR2YXIgX2N1cnJlbnRTdG9yZTtcclxuXHR2YXIgX2N1cnJlbnRPcmc7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0Z2V0T3JnczogZ2V0T3JncyxcclxuXHRcdGdldFN0b3JlczogZ2V0U3RvcmVzLFxyXG5cdFx0b246IF9saXN0ZW5cclxuXHR9O1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnRPcmcnLCB7XHJcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0Z2V0OiBnZXRfY3VycmVudE9yZyxcclxuXHRcdHNldDogc2V0X2N1cnJlbnRPcmdcclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50U3RvcmUnLCB7XHJcblx0XHRnZXQ6IGdldF9jdXJyZW50U3RvcmUsXHJcblx0XHRzZXQ6IHNldF9jdXJyZW50U3RvcmVcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIGdldE9yZ3MoKSB7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9vcmdhbml6YXRpb25zJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dmFyIG9yZ0lkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdvcmcnKTtcclxuXHRcdFx0XHRpZihvcmdJZCkge1xyXG5cdFx0XHRcdFx0c2VydmljZS5jdXJyZW50T3JnID0gXy5maW5kKHJlcy5kYXRhLCB7X2lkOiBvcmdJZH0pO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFN0b3JlcyhvcmcpIHtcclxuXHJcblx0XHRpZighb3JnIHx8ICFvcmcuX2lkKVxyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvb3JnYW5pemF0aW9ucy8nICsgb3JnLl9pZCArICcvc3RvcmVzJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dmFyIHN0b3JlSWQgPSBzdG9yYWdlU2VydmljZS5nZXQoJ3N0b3JlJyk7XHJcblx0XHRcdFx0aWYoc3RvcmVJZClcclxuXHRcdFx0XHRcdHNlcnZpY2UuY3VycmVudFN0b3JlID0gXy5maW5kKHJlcy5kYXRhLCB7aWQ6IHN0b3JlSWR9KTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50T3JnKCkge1xyXG5cdFx0cmV0dXJuIF9jdXJyZW50T3JnO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0X2N1cnJlbnRPcmcodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRPcmcgPT09IHZhbHVlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0X2N1cnJlbnRPcmcgPSB2YWx1ZTtcclxuXHRcdHN0b3JhZ2VTZXJ2aWNlLnNldCgnb3JnJywgX2N1cnJlbnRPcmcuX2lkKTtcclxuXHRcdGV2ZW50U2VydmljZS5yYWlzZSgnb3JnQ2hhbmdlZCcsIF9jdXJyZW50T3JnKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldF9jdXJyZW50U3RvcmUoKSB7XHJcblx0XHRyZXR1cm4gX2N1cnJlbnRTdG9yZTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldF9jdXJyZW50U3RvcmUodmFsdWUpIHtcclxuXHJcblx0XHRpZiAoX2N1cnJlbnRTdG9yZSA9PT0gdmFsdWUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRpZihfY3VycmVudFN0b3JlICYmIHZhbHVlICYmIF9jdXJyZW50U3RvcmUuaWQgPT0gdmFsdWUuaWQpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRfY3VycmVudFN0b3JlID0gdmFsdWU7XHJcblxyXG5cdFx0dmFyIGlkID0gX2N1cnJlbnRTdG9yZSAmJiBfY3VycmVudFN0b3JlLmlkO1xyXG5cdFx0c3RvcmFnZVNlcnZpY2Uuc2V0KCdzdG9yZScsIGlkKTtcclxuXHRcdFxyXG5cdFx0ZXZlbnRTZXJ2aWNlLnJhaXNlKCdzdG9yZUNoYW5nZWQnLCBfY3VycmVudFN0b3JlKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9saXN0ZW4obmFtZSwgaGFuZGxlcil7XHJcblx0XHRldmVudFNlcnZpY2Uub24obmFtZSwgaGFuZGxlcik7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50YXNrcycsIFsnYXBwLmRhdGEnXSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnKVxyXG5cdC5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcblx0c2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ3Rhc2tzJyxcclxuXHRcdHVybDogJy90aWNrZXRzJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdUYXNrTGlzdENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvdGFza3MvdGFza2xpc3QuaHRtbCcsXHJcblx0XHRzZXR0aW5nczoge1xyXG5cdFx0XHRtb2R1bGU6IHRydWUsXHJcblx0XHRcdG9yZGVyOiAzLFxyXG5cdFx0XHRpY29uOiBbJ2dseXBoaWNvbicsJ2dseXBoaWNvbi10YWdzJ10sXHJcblx0XHRcdGRpc3BsYXlOYW1lOiAndGlja2V0cydcclxuXHRcdH1cclxuXHR9XTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGFza3MnKVxyXG5cdC5jb250cm9sbGVyKCdUYXNrTGlzdENvbnRyb2xsZXInLCBUYXNrTGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFRhc2tMaXN0Q29udHJvbGxlcihzdG9yZVNlcnZpY2UsIGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHR0YXNrczogW10sXHJcblx0XHRzdGF0czogW11cclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdHJlZnJlc2hUYXNrcyhzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlKTtcclxuXHRyZWZyZXNoU3RhdHMoc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoVGFza3Moc3RvcmUpO1xyXG5cdFx0cmVmcmVzaFN0YXRzKHN0b3JlKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hTdGF0cyhzdG9yZSl7XHJcblx0XHRpZighc3RvcmUpXHJcblx0XHRcdHJldHVybiB2bS5zdGF0cyA9IFtdO1xyXG5cdFx0XHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzL3N0YXRzJylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblxyXG5cdFx0XHR2YXIgb3JkZXIgPSBbJ3VuYXNzaWduZWQnLCAnYXNzaWduZWQnLCAnZW5nYWdlZCcsICdjb21wbGV0ZSddO1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIHN0YXRzID0gXy5zb3J0QnkocmVzLmRhdGEsIGZ1bmN0aW9uKGl0ZW0pe1xyXG5cdFx0XHRcdHZhciBpbmRleCA9IG9yZGVyLmluZGV4T2YoaXRlbS5zdGF0dXMpO1xyXG5cdFx0XHRcdGlmKGluZGV4ID09PSAtMSlcclxuXHRcdFx0XHRcdGluZGV4ID0gMTAwO1xyXG5cdFx0XHRcdHJldHVybiBpbmRleDtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHR2bS5zdGF0cyA9IHN0YXRzO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoVGFza3Moc3RvcmUpIHtcclxuXHJcblx0XHRpZiAoIXN0b3JlKSB7XHJcblx0XHRcdHZtLnRhc2tzID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL3Rhc2tzL29wZW4nKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS50YXNrcyA9IHJlcy5kYXRhLm1hcChmdW5jdGlvbih0KXtcclxuXHRcdFx0XHRcdHJldHVybiBuZXcgVGFzayh0KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gVGFzayhyYXdUYXNrKSB7XHJcblx0dGhpcy5yYXdUYXNrID0gcmF3VGFzaztcclxuXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgcmF3VGFzayk7XHJcblxyXG5cdHRoaXMuZGlzcGxheVRpdGxlID0gcmF3VGFzay50aXRsZSB8fCByYXdUYXNrLnR5cGU7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnN0b3JlcycsIFsndWkucm91dGVyJ10pXHJcbi5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICBzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRTdGF0ZXMoKSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRTdGF0ZXMoKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogJ3N0b3JlcycsXHJcbiAgICAgICAgICAgIHVybDogJy9zdG9yZXMnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnU3RvcmVzQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvc3RvcmVzL3N0b3Jlcy5odG1sJyxcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiAyLFxyXG4gICAgICAgICAgICAgICAgaWNvbjogWydnbHlwaGljb24nLCAnZ2x5cGhpY29uLW1hcC1tYXJrZXInXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc3RvcmVzJylcclxuLmNvbnRyb2xsZXIoJ1N0b3Jlc0NvbnRyb2xsZXInLCBTdG9yZXNDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIFN0b3Jlc0NvbnRyb2xsZXIoaHR0cENsaWVudCl7XHJcblx0XHJcblx0dmFyIHZtID0gdGhpcztcclxuXHJcblx0dm0uc3RvcmVzID0gW107XHJcblx0dm0uc2VsZWN0ZWQgPSBudWxsO1xyXG5cdHZtLnRhc2tzID0gW107XHJcblxyXG5cdHZtLnNlbGVjdCA9IGZ1bmN0aW9uKHN0b3JlKXtcclxuXHRcdHZtLnNlbGVjdGVkID0gc3RvcmU7XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlLmlkICsgJy90YXNrcycpXHJcblx0XHQudGhlbihmdW5jdGlvbih4KXtcclxuXHRcdFx0dm0udGFza3MgPSB4LmRhdGE7XHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cclxuXHRmdW5jdGlvbiBpbml0KCl7XHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3JlcycpXHJcblx0XHQudGhlbihmdW5jdGlvbih4KXtcclxuXHRcdFx0dm0uc3RvcmVzID0geC5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnLCBbJ3VpLmJvb3RzdHJhcCcsICd1aS5yb3V0ZXInXSk7ICIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBhcHBSdW4oc2VjdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICBzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihbXHJcblxyXG4gICAgXSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG4uY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgTG9naW5Db250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBMb2dpbkNvbnRyb2xsZXIoc2VjdXJpdHlTZXJ2aWNlLCAkc3RhdGUpe1xyXG5cdFxyXG5cdHZhciB2bSA9dGhpcztcclxuXHR2bS5sb2dpbiA9IHtcclxuXHRcdHVzZXJuYW1lOiBcIlwiLFxyXG5cdFx0cGFzc3dvcmQ6IFwiXCIsXHJcblx0XHRyZW1lbWJlck1lOiBmYWxzZVxyXG5cdH07XHJcblxyXG5cdHRoaXMuYnVzeSA9IGZhbHNlO1xyXG5cdHRoaXMubWVzc2FnZSA9IFwiXCI7XHJcblxyXG5cdHRoaXMubG9naW4gPSBmdW5jdGlvbigpe1xyXG5cdFx0dGhpcy5idXN5ID0gdHJ1ZTtcclxuXHRcdHRoaXMubWVzc2FnZSA9IFwiXCI7XHJcblxyXG5cdFx0c2VjdXJpdHlTZXJ2aWNlLmxvZ2luKHZtLmxvZ2luLnVzZXJuYW1lLCB2bS5sb2dpbi5wYXNzd29yZCwgdm0ubG9naW4ucmVtZW1iZXJNZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpe1xyXG5cdFx0XHRcdHZtLm1lc3NhZ2UgPSAoZXguZGF0YSAmJiBleC5kYXRhLm1lc3NhZ2UpIHx8IFwiVW5hYmxlIHRvIGxvZyBpblwiO1xyXG5cclxuXHRcdFx0fSkuZmluYWxseShmdW5jdGlvbigpe1xyXG5cdFx0XHRcdHZtLmJ1c3kgPSBmYWxzZTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdH07XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5lbXBsb3llZXMnLCBbJ2FwcC5kYXRhJ10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZW1wbG95ZWVzJylcclxuLnJ1bihjb25maWd1cmVSb3V0ZXMpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcyhzZWN0aW9uTWFuYWdlcil7XHJcblx0c2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0Um91dGVzKCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRSb3V0ZXMoKXtcclxuXHRyZXR1cm4gW3tcclxuXHRcdG5hbWU6ICdlbXBsb3llZXMnLFxyXG5cdFx0dXJsOiAnL2VtcGxveWVlcycsXHJcblx0XHRjb250cm9sbGVyOiAnRW1wbG95ZWVzQ29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9lbXBsb3llZXMvZW1wbG95ZWVzLmh0bWwnLFxyXG5cdFx0c2V0dGluZ3M6IHtcclxuXHRcdFx0bW9kdWxlOiB0cnVlLFxyXG5cdFx0XHRvcmRlcjogNCxcclxuXHRcdFx0aWNvbjogWydmYScsICdmYS11c2VycyddXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVtcGxveWVlcycpXHJcblx0LmNvbnRyb2xsZXIoJ0VtcGxveWVlc0NvbnRyb2xsZXInLCBFbXBsb3llZXNDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBFbXBsb3llZXNDb250cm9sbGVyKHN0b3JlU2VydmljZSwgZXZlbnRTZXJ2aWNlLCBodHRwQ2xpZW50KSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGVtcGxveWVlczogW11cclxuXHR9KTtcclxuXHJcblx0ZXZlbnRTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBvblN0b3JlQ2hhbmdlZCk7XHJcblxyXG5cdHJlZnJlc2hFbXBsb3llZXMoc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSk7XHJcblxyXG5cdGZ1bmN0aW9uIG9uU3RvcmVDaGFuZ2VkKGUsIHN0b3JlKSB7XHJcblx0XHRyZWZyZXNoRW1wbG95ZWVzKHN0b3JlKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlZnJlc2hFbXBsb3llZXMoc3RvcmUpIHtcclxuXHRcdGlmICghc3RvcmUpIHtcclxuXHRcdFx0dm0uZW1wbG95ZWVzID0gW107XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmUuaWQgKyAnL2VtcGxveWVlcycsIHtjYWNoZTogZmFsc2V9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5lbXBsb3llZXMgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgWydhcHAuc2VjdGlvbnMnXSlcclxuICAgIC5ydW4oYXBwUnVuKTtcclxuLy8uY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Jvb3QnLCB7XHJcbi8vICAgICAgICB1cmw6ICcnLFxyXG4vLyAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbi8vICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbi8vICAgIH0pO1xyXG5cclxuLy8gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcclxuLy8gICAgICAgIHVybDogJycsXHJcbi8vICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJyxcclxuLy8gICAgICAgIGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuLy8gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCdcclxuLy8gICAgfSk7XHJcblxyXG4vL30pO1xyXG5cclxuZnVuY3Rpb24gYXBwUnVuKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG4gICAgc2VjdGlvbk1hbmFnZXIucmVnaXN0ZXIoZ2V0U3RhdGVzKCkpO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0U3RhdGVzKCkge1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdkYXNoYm9hcmQnLFxyXG4gICAgICAgICAgICB1cmw6ICcvJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXHJcbiAgICAgICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogMSxcclxuICAgICAgICAgICAgICAgIGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1zdGF0cyddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdO1xyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJylcclxuICAgIC5jb250cm9sbGVyKCdEYXNoYm9hcmRDb250cm9sbGVyJywgRGFzaGJvYXJkQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRGFzaGJvYXJkQ29udHJvbGxlcigpIHtcclxuICAgIHRoaXMubWVzc2FnZSA9IFwiSGVsbG8gV29ybGRcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcsWydhcHAuc29ja2V0J10pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhdCcpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCwgJHEsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGdldEJ5SWQ6IF9nZXRCeUlkLFxyXG5cdFx0Z2V0QWxsRm9yU3RvcmU6IF9nZXRBbGxGb3JTdG9yZVxyXG5cdH1cclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gX2dldEJ5SWQoaWQpIHtcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldEFsbEZvclN0b3JlKHN0b3JlSWQpIHtcclxuXHJcblx0XHRpZiAoIXN0b3JlSWQpXHJcblx0XHRcdHJldHVybiAkcS5yZWplY3QoJ25vIHN0b3JlIGlkJyk7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBzdG9yZUlkICsgJy9jaGF0JylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGlkLCBtZXNzYWdlKSB7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvY2hhdC8nICsgaWQgKyAnL21lc3NhZ2VzJztcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCB7XHJcblx0XHRcdFx0bWVzc2FnZTogbWVzc2FnZVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpIHtcclxuXHJcblx0XHQvLyBzb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbihhLCBiKSB7XHJcblx0XHRcdFxyXG5cdFx0Ly8gXHR2YXIgaWQgPSBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlICYmIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUuaWQ7XHJcblx0XHQvLyBcdGlmKGlkKVxyXG5cdFx0Ly8gXHRcdF9yZWdpc3RlcihpZCk7XHJcblx0XHQvLyB9KTtcclxuXHJcblx0XHQvLyBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIHN0b3JlKSB7XHJcblx0XHQvLyBcdF9yZWdpc3RlcihzdG9yZS5pZCk7XHJcblx0XHQvLyB9KTtcclxuXHJcblx0XHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHNvY2tldC5vbignbmV3LWNoYXQnLCBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCduZXctY2hhdCcsIGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCduZXctY2hhdCcsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvLyBmdW5jdGlvbiBfcmVnaXN0ZXIoc3RvcmVJZCkge1xyXG5cdC8vIFx0Y29uc29sZS5sb2coJ3JlZ2lzdGVyOiAnICsgc3RvcmVJZCk7XHJcblx0Ly8gXHRzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7XHJcblx0Ly8gXHRcdGFwcDogJ3NvbG9tb24nLFxyXG5cdC8vIFx0XHRzdG9yZUlkOiBzdG9yZUlkXHJcblx0Ly8gXHR9KTtcclxuXHQvLyB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYXQnKVxyXG4ucnVuKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKHNlY3Rpb25NYW5hZ2VyKXtcclxuXHRzZWN0aW9uTWFuYWdlci5yZWdpc3RlcihnZXRTdGF0ZXMoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0YXRlcygpe1xyXG5cdHJldHVybiBbe1xyXG5cdFx0bmFtZTogJ2NoYXQtbGlzdCcsXHJcblx0XHR1cmw6ICcvY2hhdHMnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0NoYXRMaXN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXQtbGlzdC5odG1sJyxcclxuXHRcdHNldHRpbmdzOiB7XHJcblx0XHRcdG1vZHVsZTogdHJ1ZSxcclxuXHRcdFx0b3JkZXI6IDQsXHJcblx0XHRcdGljb246IFsnZ2x5cGhpY29uJywgJ2dseXBoaWNvbi1jbG91ZCddXHJcblx0XHR9XHJcblx0fV07XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihzdG9yZVNlcnZpY2UsIGh0dHBDbGllbnQsIGV2ZW50U2VydmljZSwgY2hhdFNlcnZpY2UsICRyb290U2NvcGUsIHNlY3VyaXR5U2VydmljZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRjaGF0czogbnVsbCxcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGN1cnJlbnRDaGF0OiBudWxsLFxyXG5cdFx0c2VsZWN0Q2hhdDogX3NlbGVjdENoYXQsXHJcblx0XHRpc1NlbGVjdGVkOiBfaXNDaGF0U2VsZWN0ZWRcclxuXHR9KTtcclxuXHJcblx0aWYoc3RvcmVTZXJ2aWNlLmN1cnJlbnRTdG9yZSlcclxuXHRcdG9uU3RvcmVDaGFuZ2VkKG51bGwsIHN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUpO1xyXG5cclxuXHRldmVudFNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIG9uU3RvcmVDaGFuZ2VkKTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGUsIG1zZykge1xyXG5cclxuXHRcdGlmKHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpLl9pZCA9PSBtc2cudXNlcilcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHZhciBjaGF0ID0gZ2V0Q2hhdChtc2cuY2hhdCk7XHJcblxyXG5cdFx0aWYgKHZtLmN1cnJlbnRDaGF0ICYmIHZtLmN1cnJlbnRDaGF0Ll9pZCA9PSBtc2cuY2hhdCkge1xyXG5cdFx0XHR2bS5jdXJyZW50Q2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHR0aW1lOiBtc2cudGltZSxcclxuXHRcdFx0XHR1c2VyOiBtc2cudXNlclxyXG5cdFx0XHR9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNoYXQuaGFzVW5yZWFkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJ25ldy1jaGF0JywgZnVuY3Rpb24oZSwgbXNnKXtcclxuXHRcdHZtLmNoYXRzLnVuc2hpZnQobXNnKTtcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gb25TdG9yZUNoYW5nZWQoZSwgc3RvcmUpIHtcclxuXHRcdHJlZnJlc2hDaGF0cyhzdG9yZSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWZyZXNoQ2hhdHMoc3RvcmUpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5nZXRBbGxGb3JTdG9yZShzdG9yZS5pZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oY2hhdGxpc3QpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IGNoYXRsaXN0O1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGNoYXQsIG1lc3NhZ2UpIHtcclxuXHRcdHJldHVybiBjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0Ll9pZCwgbWVzc2FnZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0Y2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHRcdG1lc3NhZ2U6IG1zZy5tZXNzYWdlLFxyXG5cdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHR1c2VyOiBtc2cudXNlcixcclxuXHRcdFx0XHRcdHNlbnQ6IHRydWVcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhleCk7XHJcblx0XHRcdH0pLmZpbmFsbHkoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y2hhdC5jdXJyZW50TWVzc2FnZSA9ICcnO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZWxlY3RDaGF0KGlkKSB7XHJcblx0XHRjaGF0U2VydmljZS5nZXRCeUlkKGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihjaGF0KSB7XHJcblx0XHRcdFx0dm0uY3VycmVudENoYXQgPSBjaGF0O1xyXG5cdFx0XHRcdC8vdm0uaGFzVW5yZWFkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGdldENoYXQoY2hhdC5faWQpLmhhc1VucmVhZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfaXNDaGF0U2VsZWN0ZWQoY2hhdCl7XHJcblxyXG5cdFx0aWYoIXZtLmN1cnJlbnRDaGF0KVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0cmV0dXJuIGNoYXQuX2lkID09IHZtLmN1cnJlbnRDaGF0Ll9pZDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldENoYXQoaWQpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdm0uY2hhdHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0aWYgKHZtLmNoYXRzW2ldLl9pZCA9PSBpZClcclxuXHRcdFx0XHRyZXR1cm4gdm0uY2hhdHNbaV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmxheW91dCcpXHJcblx0LmNvbnRyb2xsZXIoJ0FzaWRlQ29udHJvbGxlcicsIEFzaWRlQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQXNpZGVDb250cm9sbGVyKHNlY3Rpb25NYW5hZ2VyKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNlY3Rpb25zOiBzZWN0aW9uTWFuYWdlci5nZXRNb2R1bGVzKClcclxuXHR9KTtcclxuXHJcblx0Ly92bS5zZWN0aW9ucyA9IHNlY3Rpb25NYW5hZ2VyLmdldE1vZHVsZXMoKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuICAgIC5jb250cm9sbGVyKCdTaGVsbENvbnRyb2xsZXInLCBTaGVsbENvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFNoZWxsQ29udHJvbGxlcihzZWN0aW9uTWFuYWdlcikge1xyXG5cclxuICAgIC8vdmFyIHZtID0gdGhpcztcclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdhcHAubGF5b3V0JylcclxuXHQuY29uZmlnKGluaXRpYWxpemVTdGF0ZXMpXHJcblx0LnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgc2VjdXJpdHlTZXJ2aWNlLCAkdGltZW91dCkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHRpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdXNlciA9IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpO1xyXG5cdFx0aWYgKHVzZXIpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdHNlY3VyaXR5U2VydmljZS5yZXF1ZXN0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1KSB7XHJcblxyXG5cdFx0XHRcdHZhciB0YXJnZXRTdGF0ZSA9IHUgPyB0b1N0YXRlIDogJ2xvZ2luJztcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKHRhcmdldFN0YXRlKTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpIHtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgd2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XHJcblx0XHRcclxuXHRcdGlmKCEkcm9vdFNjb3BlLnNob3dTcGxhc2gpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHR3YWl0aW5nRm9yVmlldyA9IHRydWU7XHJcblx0fSk7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbihlKSB7XHJcblxyXG5cclxuXHRcdGlmICh3YWl0aW5nRm9yVmlldyAmJiAkcm9vdFNjb3BlLnNob3dTcGxhc2gpIHtcclxuXHRcdFx0d2FpdGluZ0ZvclZpZXcgPSBmYWxzZTtcclxuXHJcblx0XHRcdGNvbnNvbGUubG9nKCdnaXZlIHRpbWUgdG8gcmVuZGVyJyk7XHJcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzaG93U3BsYXNoID0gZmFsc2UnKTtcclxuXHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHRcdFx0fSwgMTApO1xyXG5cclxuXHRcdH1cclxuXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBpbml0aWFsaXplU3RhdGVzKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuXHJcblx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgncm9vdCcsIHtcclxuXHRcdFx0dXJsOiAnJyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdHRlbXBsYXRlOiAnPGRpdiB1aS12aWV3PjwvZGl2PicsXHJcblx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHRcdFx0XHRpZiAoJHJvb3RTY29wZS5zaG93U3BsYXNoID09PSB1bmRlZmluZWQpXHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnNob3dTcGxhc2ggPSB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0Ly8gQG5nSW5qZWN0XHJcblx0XHRcdFx0dXNlcjogZnVuY3Rpb24oc2VjdXJpdHlTZXJ2aWNlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogLyogQG5nSW5qZWN0ICovIGZ1bmN0aW9uKCRzdGF0ZSwgdXNlcikge1xyXG5cdFx0XHRcdC8vIGlmKHVzZXIpXHJcblx0XHRcdFx0Ly8gICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xyXG5cclxuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2xvZ2luJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0XHQvLyB1cmw6ICcnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiBcInZtXCIsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xvZ2luL2xvZ2luLmh0bWwnXHJcblx0XHR9KVxyXG5cdFx0LnN0YXRlKCdhcHAtcm9vdCcsIHtcclxuXHRcdFx0Ly91cmw6ICcnLFxyXG5cdFx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdFx0YWJzdHJhY3Q6IHRydWUsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdTaGVsbENvbnRyb2xsZXInLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9sYXlvdXQvc2hlbGwuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHQvL3VzZXI6IGZ1bmN0aW9uKClcclxuXHRcdFx0fSxcclxuXHRcdFx0b25FbnRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1NoZWxsQ29udHJvbGxlci5vbkVudGVyJyk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5sYXlvdXQnKVxyXG5cdC5jb250cm9sbGVyKCdIZWFkZXJDb250cm9sbGVyJywgSGVhZGVyQ29udHJvbGxlcik7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzZWN1cml0eVNlcnZpY2UsIHN0b3JlU2VydmljZSwgZXZlbnRTZXJ2aWNlLCB1dGlsKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdG1lc3NhZ2U6IFwiSGVsbG8gSGVhZGVyXCIsXHJcblx0XHR1c2VyOiBzZWN1cml0eVNlcnZpY2UuY3VycmVudFVzZXIsXHJcblx0XHRvcmdzOiBbXSxcclxuXHRcdHN0b3JlczogW11cclxuXHR9KTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHZtLCAnb3JnJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudE9yZzt9LFxyXG5cdFx0c2V0OiBmdW5jdGlvbih2YWx1ZSl7c3RvcmVTZXJ2aWNlLmN1cnJlbnRPcmcgPSB2YWx1ZTt9XHJcblx0fSk7XHJcblxyXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2bSwgJ3N0b3JlJywge1xyXG5cdFx0Z2V0OiBmdW5jdGlvbigpe3JldHVybiBzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlO30sXHJcblx0XHRzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlID0gdmFsdWU7fVxyXG5cdH0pO1xyXG5cclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdvcmcnKTtcclxuXHQvL3V0aWwuYWRkUHJvcGVydHkodm0sICdzdG9yZScpO1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRcdHZtLnVzZXIgPSB4O1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRzZWN1cml0eVNlcnZpY2Uub24oJ3VzZXJDaGFuZ2VkJywgaGFuZGxlVXNlckNoYW5nZWQpO1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRPcmdzKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKG9yZ3Mpe1xyXG5cdFx0XHR2bS5vcmdzID0gb3JncztcclxuXHRcdFx0XHJcblx0XHRcdGlmKCFzdG9yZVNlcnZpY2UuY3VycmVudE9yZylcclxuXHRcdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudE9yZyA9IHZtLm9yZ3NbMF07XHJcblxyXG5cdFx0XHRyZWZyZXNoU3RvcmVzKHN0b3JlU2VydmljZS5jdXJyZW50T3JnKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGV2ZW50U2VydmljZS5vbignb3JnQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIG9yZyl7XHJcblx0XHRcdC8vdm0ub3JnID0gb3JnO1xyXG5cdFx0XHRyZWZyZXNoU3RvcmVzKG9yZyk7XHJcblx0XHRcdFxyXG5cdFx0fSk7XHJcblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVmcmVzaFN0b3Jlcyhvcmcpe1xyXG5cdFx0cmV0dXJuIHN0b3JlU2VydmljZS5nZXRTdG9yZXMob3JnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZXMpe1xyXG5cdFx0XHRcdHZtLnN0b3JlcyA9IHN0b3JlcztcclxuXHJcblx0XHRcdFx0aWYoIXN0b3JlU2VydmljZS5jdXJyZW50U3RvcmUpXHJcblx0XHRcdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudFN0b3JlID0gdm0uc3RvcmVzWzBdO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZVVzZXJDaGFuZ2VkKHVzZXIpIHtcclxuXHRcdHZtLnVzZXIgPSB1c2VyO1xyXG5cdH1cclxufSIsIihmdW5jdGlvbiAoKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbn0oKSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb25maWcnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb25maWcnKVxyXG4uY29uc3RhbnQoJ2VudicsIHtcclxuICAgIGFwaVJvb3Q6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==