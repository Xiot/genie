(function () {
    'use strict';
    angular.module('qarin.tickets', []);
}());
(function () {
    'use strict';
    angular.module('qarin.tickets').factory('ticketService', TicketService);
    function TicketService(storeService, httpClient, util, socket) {
        var store = storeService.current;
        var service = {
            create: createTicket,
            get: getTicket,
            on: addHandler
        };
        init();
        return service;
        function getTicket(id) {
            var url = util.join('stores', store.id, 'tasks', id);
            return httpClient.get(url).then(function (res) {
                return res.data;
            });
        }
        function createTicket(product) {
            var request = { type: 'request' };
            var url = util.join('stores', store.id, 'tasks');
            return httpClient.post(url, request).then(function (res) {
                return res.data;
            });
        }
        function init(service) {
            storeService.on('storeChanged', function (e, store) {
                store = store;
            });
        }
        function addHandler(message, handler) {
            socket.on(message, handler);
            return function () {
                socket.removeListener(message, handler);
            };
        }
    }
    TicketService.$inject = ["storeService", "httpClient", "util", "socket"];
}());
(function () {
    'use strict';
    angular.module('qarin', [
        'symbiote.common',
        'qarin.partials',
        'ui.router',
        'ngAnimate',
        'btford.socket-io',
        'qarin.interceptors',
        'qarin.errors',
        'qarin.home',
        'qarin.products',
        'qarin.tickets',
        'qarin.chat'
    ]).config(["$stateProvider", "$httpProvider", "$urlRouterProvider", function ($stateProvider, $httpProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider.state('root', {
            url: '',
            abstract: true,
            views: {
                '': {
                    //controller: 'RootController',
                    templateUrl: 'app/areas/layout/layout.html'
                }    // ,
                     // notifications: {
                     //     controller: 'NotificationsController',
                     //     templateUrl: 'app/areas/notifications/notifications.html'
                     // }
            }
        }).state('layout', {
            url: '',
            parent: 'root',
            abstract: true,
            template: '<div ui-view></div>'
        });
    }]);
    angular.module('qarin').run(["$rootScope", "$state", function ($rootScope, $state) {
        $rootScope.$state = $state;
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            console.log(unfoundState.to);
            // "lazy.state"
            console.log(unfoundState.toParams);
            // {a:1, b:2}
            console.log(unfoundState.options);    // {inherit:false} + default options
        });
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            console.log('unable to transition to state ' + toState.name);
            console.log(error);
        });
    }]);
}());
(function () {
    'use strict';
    angular.module('qarin').config(configureRoutes);
    function configureRoutes($stateProvider) {
        $stateProvider.state('ticket-info', {
            url: '/tickets/:ticketId',
            controller: 'TicketController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/tickets/ticket-details.html',
            resolve: {
                ticket: ["ticketService", "$stateParams", function (ticketService, $stateParams) {
                    var id = $stateParams.ticketId;
                    return ticketService.get(id);
                }]
            }
        }).state('ticket-created', {
            url: '/tickets/:ticketId/created',
            controller: 'TicketController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/tickets/ticket-created.html',
            resolve: {
                ticket: ["ticketService", "$stateParams", function (ticketService, $stateParams) {
                    var id = $stateParams.ticketId;
                    return ticketService.get(id);
                }]
            }
        });
    }
    configureRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('TicketController', TicketController);
    function TicketController($scope, ticket, ticketService, $state) {
        var vm = angular.extend(this, {
            ticket: ticket,
            chat: gotoChat
        });
        function gotoChat() {
            return $state.go('chat', { chatId: ticket.chat });
        }
        var unbind = ticketService.on('task:assigned', function (data) {
            console.log('task:assigned', data);
        });
        $scope.$on('$destroy', function () {
            console.log('ticket.controller - destroy');
            unbind();
        });
    }
    TicketController.$inject = ["$scope", "ticket", "ticketService", "$state"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('OutsideShellController', OutsideShellController);
    function OutsideShellController(storeService, storageService, $state) {
        var node = document.createElement('style');
        document.body.appendChild(node);
        window.addStyleString = function (str) {
            node.innerHTML = str;
        };
        var vm = angular.extend(this, {
            setStore: _setStore,
            setStoreUsingLocation: _setStoreUsingLocation
        });
        function _setStore(id) {
            return storeService.getById(id).then(function (store) {
                storeService.current = store;
                storageService.set('store', id, true);
                $state.go('home');
                return store;
            });
        }
        function _setStoreUsingLocation() {
            storageService.remove('store');
            return storeService.getCurrentStore().then(function (store) {
                $state.go('home');
                return store;
            });
        }
    }
    OutsideShellController.$inject = ["storeService", "storageService", "$state"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('NotificationsController', ["$scope", "socket", function ($scope, socket) {
        $scope.current = {};
        //notificationSocket
        socket.on('help', function (data) {
            $scope.current = data;
        });
        socket.on('chat-message', function (data) {
        });
    }]);
}());
(function () {
    'use strict';
    angular.module('qarin.products', ['ui.router']);
}());
(function () {
    'use strict';
    angular.module('qarin.products').controller('SearchController', SearchController);
    // @ngInject
    function SearchController(httpClient, storeService, query, $state, $location) {
        var vm = angular.extend(this, {
            products: [],
            query: query || '',
            search: _search
        });
        _init();
        function _init() {
            if (!vm.query)
                return;
            // 	_search();
            var url = '/stores/' + storeService.current.id + '/products?search=' + vm.query;
            httpClient.get(url).then(function (res) {
                vm.products = res.data;
            });
        }
        function _search() {
            // var originalUrl = $location.url();
            // var url = $state.href('search', {query: vm.query});
            // if(originalUrl !== url)
            // 	$location.url(url);
            //$location.push
            $state.go('search', { query: vm.query }, { reload: true });
        }
    }
    SearchController.$inject = ["httpClient", "storeService", "query", "$state", "$location"];
}());
(function () {
    'use strict';
    angular.module('qarin.products').config(registerRoutes);
    // @ngInject
    function registerRoutes($stateProvider) {
        $stateProvider.state('search', {
            url: '/search?query',
            controller: 'SearchController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/products/search.html',
            resolve: {
                query: ["$stateParams", function ($stateParams) {
                    return $stateParams.query;
                }]
            }
        }).state('product', {
            url: '/product/:productId',
            controller: 'ProductController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/products/product.html',
            resolve: {
                product: ["productService", "$stateParams", function (productService, $stateParams) {
                    return productService.get($stateParams.productId);
                }]
            }
        });
    }
    registerRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin.products').factory('productService', ProductService);
    function ProductService(httpClient, storeService) {
        var service = { get: _getProductById };
        return service;
        function _getProductById(id) {
            return httpClient.get('/stores/' + storeService.current.id + '/products/' + id).then(function (res) {
                return res.data;
            });
        }
    }
    ProductService.$inject = ["httpClient", "storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin.products').controller('ProductController', ProductController);
    // @ngInject
    function ProductController(productService, product, $state, chatService) {
        var vm = angular.extend(this, {
            product: product,
            createChat: _createChat
        });
        function _createChat() {
            chatService.create({ product: product._id }).then(function (chat) {
                $state.go('chat', { id: chat._id });
            }).catch(function (ex) {
                console.log(ex);
            });
        }
    }
    ProductController.$inject = ["productService", "product", "$state", "chatService"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('LocatorController', LocatorController);
    /* @ngInject */
    function LocatorController($scope, storeService) {
    }
    LocatorController.$inject = ["$scope", "storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin').run(ensureAuthenticated);
    /* @ngInject */
    function ensureAuthenticated($rootScope, $state, $timeout, storeService, errorService) {
        $rootScope.showSplash = true;
        $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
            // if (toState.name === 'login') {
            // 	return;
            // }
            var store = storeService.current;
            if (store)
                return;
            e.preventDefault();
            storeService.getCurrentStore().then(function (ret) {
                $state.go(toState, toParams);
            }).catch(function (err) {
                errorService.lastError = err;
                $state.go('error');
            });    // securityService.requestCurrentUser()
                   // 	.then(function(u) {
                   // 		var targetState = u ? toState : 'login';
                   // 		$state.go(targetState);
                   // 	}).catch(function(ex) {
                   // 		$state.go('login');
                   // 	});
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
    ensureAuthenticated.$inject = ["$rootScope", "$state", "$timeout", "storeService", "errorService"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('HeaderController', HeaderController);
    function HeaderController(storeService, socket, $state) {
        var vm = angular.extend(this, {
            store: storeService.current,
            notifications: []
        });
        socket.on('message', function (data) {
            var notification = {
                name: 'message',
                data: data,
                go: function () {
                    $state.go('chat({id: data.chat})');
                }
            };
            vm.notifications.unshift(notification);
        });
        storeService.on('storeChanged', function (e, args) {
            vm.store = args.store;
        });
    }
    HeaderController.$inject = ["storeService", "socket", "$state"];
}());
(function () {
    'use strict';
    angular.module('qarin.home', ['ui.router']);
}());
(function () {
    'use strict';
    angular.module('qarin.home').config(configureRoutes);
    /* @ngInject */
    function configureRoutes($stateProvider) {
        $stateProvider.state('home', {
            url: '/',
            parent: 'layout',
            templateUrl: 'app/areas/home/home.html',
            controller: 'HomeController',
            controllerAs: 'vm'
        });
    }
    configureRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin.home').controller('HomeController', HomeController);
    function HomeController($scope, $http, env, socket, storeService, ticketService, $state) {
        var vm = angular.extend(this, {
            store: storeService.current,
            requestHelp: _requestHelp
        });
        function _requestHelp() {
            //return storeService.requestHelp();
            return ticketService.create().then(function (ticket) {
                return $state.go('ticket-created', { ticketId: ticket._id });
            });
        }
        storeService.on('storeChanged', function (e, args) {
            vm.store = args.store;
        });
    }
    HomeController.$inject = ["$scope", "$http", "env", "socket", "storeService", "ticketService", "$state"];
}());
(function () {
    'use strict';
    angular.module('qarin.errors', []);
}());
(function () {
    'use strict';
    angular.module('qarin.errors').config(configureRoutes);
    function configureRoutes($stateProvider) {
        $stateProvider.state('error', {
            url: '/error',
            parent: 'root',
            controller: 'ErrorsController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/errors/error.html'
        });
    }
    configureRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin.errors').controller('ErrorController', ErrorController);
    // @ngInject
    function ErrorController(errorService, $rootScope) {
        var vm = angular.extend(this, { error: errorService.lastError });
        $rootScope.showSplash = false;
    }
    ErrorController.$inject = ["errorService", "$rootScope"];
}());
(function () {
    'use strict';
    angular.module('qarin.errors').factory('errorService', ErrorService);
    // @ngInject
    function ErrorService() {
        var service = { lastError: null };
        return service;
    }
}());
(function () {
    'use strict';
    angular.module('qarin.chat', []);
}());
(function () {
    'use strict';
    angular.module('qarin.chat').controller('ChatListController', ChatListController);
    // @ngInject
    function ChatListController(httpClient, storeService, $state, chatService) {
        var vm = angular.extend(this, {
            chats: null,
            create: _createNewChat
        });
        _init();
        function _init() {
            var opts = { params: { store: storeService.current.id } };
            chatService.getMyChats().then(function (chats) {
                var activeChats = [];
                chats.forEach(function (c) {
                    if (c.lastMessage)
                        activeChats.push(c);
                });
                vm.chats = activeChats;
            })    // httpClient.get('/users/me/chats', opts)
                  // 	.then(function(res) {
                  // 		vm.chats = parse(res.data);
                  // 	});
;
        }
        function _createNewChat() {
            chatService.create().then(function (chat) {
                $state.go('chat', { chatId: chat._id });
            });    // httpClient.post('/stores/' + storeService.current.id + '/chat')
                   // .then(function(res){
                   // 	$state.go('chat', {id: res.data._id});
                   // });
        }
    }
    ChatListController.$inject = ["httpClient", "storeService", "$state", "chatService"];
}());
(function () {
    'use strict';
    angular.module('qarin.chat').factory('chatService', ChatFactory);
    /* @ngInject */
    function ChatFactory($rootScope, httpClient, socket, storeService) {
        var service = {
            sendMessage: sendMessage,
            create: _createChat,
            getById: getChatById,
            getMyChats: getMyChats
        };
        init();
        return service;
        function sendMessage(id, message) {
            var url = '/chat/' + id + '/messages';
            return httpClient.post(url, { message: message }).then(function (res) {
                return res.data;
            });
        }
        function _createChat(opts) {
            return httpClient.post('/stores/' + storeService.current.id + '/chat', opts).then(function (res) {
                return res.data;
            });
        }
        function getChatById(id) {
            return httpClient.get('/chat/' + id).then(function (res) {
                return new Chat(res.data);
            });
        }
        function init() {
            socket.on('chat:message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
        }
        function getMyChats() {
            return httpClient.get('/users/me/chats').then(function (res) {
                return parse(res.data);
            });
        }
        function parse(data) {
            return data.map(function (x) {
                return new Chat(x);
            });
        }
        function Chat(data) {
            // copy raw properties
            angular.extend(this, data);
            var myDeviceId = 'dev-1';
            var others = [];
            data.participants.forEach(function (x) {
                if (x.device === myDeviceId)
                    return;
                others.push(x.firstName);
            });
            this.users = others.join(', ');
            this.lastMessage = data.messages.slice(-1)[0];
        }
    }
    ChatFactory.$inject = ["$rootScope", "httpClient", "socket", "storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin.chat').config(configureRoutes);
    function configureRoutes($stateProvider) {
        $stateProvider.state('chat-list', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chatlist.html',
            controller: 'ChatListController',
            controllerAs: 'vm'
        }).state('chat', {
            url: '/chat/:chatId',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chat.html',
            controller: 'ChatController',
            controllerAs: 'vm',
            resolve: {
                chatId: ["$stateParams", function ($stateParams) {
                    return $stateParams.chatId;
                }],
                chat: ["chatId", "chatService", function (chatId, chatService) {
                    return chatService.getById(chatId);
                }]
            }
        });
    }
    configureRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin.chat').controller('ChatController', ["socket", "storeService", "chat", "httpClient", "$rootScope", "chatService", function (socket, storeService, chat, httpClient, $rootScope, chatService) {
        var vm = angular.extend(this, {
            chat: chat,
            send: sendMessage,
            message: '',
            product: null
        });
        // httpClient.get('/chat/' + chatId)
        // 	.then(function(res) {
        // 		vm.chat = res.data;
        // 	});
        $rootScope.$on('chat-message', function (e, msg) {
            vm.chat.messages.push(msg);
        });
        function sendMessage() {
            var message = vm.message;
            vm.message = '';
            chatService.sendMessage(chat._id, message).then(function (msg) {
                vm.chat.messages.push({
                    message: msg.message,
                    time: msg.time,
                    user: msg.user,
                    sent: true
                });
            });
        }
    }]);
}());
(function () {
    'use strict';
    angular.module('qarin').service('util', UtilService);
    function UtilService() {
        this.join = function () {
            var args = [].slice.call(arguments);
            return '/' + args.join('/');
        };
    }
}());
(function () {
    'use strict';
    angular.module('qarin').factory('storeService', StoreService);
    /* @ngInject */
    function StoreService(geoLocation, httpClient, $rootScope, storageService) {
        var _current = null;
        var availableEvents = ['storeChanged'];
        var service = {
            getById: _getById,
            getCurrentStore: _getCurrentStore,
            on: _registerListener,
            requestHelp: requestHelp
        };
        Object.defineProperty(service, 'current', {
            get: _get_current,
            set: _set_current,
            enumerable: true
        });
        return service;
        function requestHelp() {
            var request = { type: 'request' };
            var url = '/stores/' + _current.id + '/tasks';
            return httpClient.post(url, request).then(function (res) {
                return res.data;
            });
        }
        function _get_current() {
            return _current;
        }
        function _set_current(value) {
            _current = value;
            $rootScope.$emit('storeChanged', { store: _current });
        }
        function _getById(id) {
            return httpClient.get('/stores/' + id).then(function (res) {
                return res.data;
            });
        }
        function _getCurrentStore() {
            var storedStore = storageService.get('store');
            if (storedStore) {
                return _getById(storedStore).then(function (store) {
                    _current = store;
                    $rootScope.$emit('storeChanged', { store: _current });
                });
            }
            return geoLocation.getGps().then(function (gps) {
                var params = {
                    lat: gps.coords.latitude,
                    lng: gps.coords.longitude
                };
                return httpClient.get('/locations', { params: params }).then(function (response) {
                    if (response.data.length >= 1) {
                        _current = response.data[0];
                        $rootScope.$emit('storeChanged', { store: _current });
                    }
                    return _current;
                });
            });
        }
        function _registerListener(name, handler) {
            if (availableEvents.indexOf(name) === -1)
                throw new Error('The event \'' + name + '\' is not available on storeService.');
            return $rootScope.$on(name, handler);
        }
    }
    StoreService.$inject = ["geoLocation", "httpClient", "$rootScope", "storageService"];
}());
(function () {
    'use strict';
    angular.module('qarin').factory('socketBuilder', ["socketFactory", "env", "storageService", "storeService", function (socketFactory, env, storageService, storeService) {
        var builder = function (namespace) {
            var uri = env.apiRoot;
            if (namespace)
                uri += namespace;
            var deviceId = storageService.get('device-id');
            var myIoSocket = io.connect(uri, { query: 'device=' + deviceId });
            var socket = socketFactory({ ioSocket: myIoSocket });
            socket.io = myIoSocket;
            function register() {
                //var user = securityService.currentUser();
                socket.emit('register', {
                    storeId: storeService.current && storeService.current.id,
                    //userId: user && user._id,
                    deviceId: deviceId,
                    app: 'qarin'
                });
            }
            socket.on('connect', register);
            storeService.on('storeChanged', register);
            return socket;
        };
        return builder;
    }]).factory('socket', ["socketBuilder", function (socketBuilder) {
        return socketBuilder();
    }]);
}());
(function () {
    'use strict';
    angular.module('qarin').factory('notificationService', NotificationService);
    /* @ngInject */
    function NotificationService($rootScope, socketBuilder) {
        var socket = socketBuilder('');
        socket.on('message', function (data) {
        });
    }
    NotificationService.$inject = ["$rootScope", "socketBuilder"];
}());
(function () {
    'use strict';
    angular.module('qarin').factory('geoLocation', GeoLocationService);
    // @ngInject
    function GeoLocationService($q, $window, $rootScope) {
        var watcherCount = 0;
        return { getGps: _currentPosition };
        function _currentPosition() {
            if (!$window.navigator.geolocation)
                return $q.reject('GPS is not available on your device.');
            var defer = $q.defer();
            $window.navigator.geolocation.getCurrentPosition(function (pos) {
                $rootScope.$apply(function () {
                    defer.resolve(pos);
                });
            }, function (ex) {
                $rootScope.$apply(function () {
                    switch (ex.code) {
                    case 1:
                        return defer.reject('Permission Denied');
                    case 2:
                        return defer.reject('Position Unavailable');
                    case 3:
                        return defer.reject('Timeout');
                    default:
                        return defer.reject('Unkown');
                    }
                });
            });
            return defer.promise;
        }
    }
    GeoLocationService.$inject = ["$q", "$window", "$rootScope"];
}());
(function () {
    'use strict';
    angular.module('qarin.interceptors', []).factory('deviceInterceptor', DeviceInterceptor).config(addInterceptors);
    function DeviceInterceptor($q, storageService) {
        return {
            request: function (config) {
                if (!config || !config.headers)
                    return config;
                config.headers['x-device'] = storageService.get('device-id');
                return config;
            }
        };
    }
    DeviceInterceptor.$inject = ["$q", "storageService"];
    function addInterceptors($httpProvider) {
        $httpProvider.interceptors.push('deviceInterceptor');
    }
    addInterceptors.$inject = ["$httpProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin').directive('qaSetStoreClass', setStoreClass);
    // @ngInject
    function setStoreClass(storeService) {
        return { link: _linkFn };
        function _linkFn(scope, element, attrs) {
            storeService.on('storeChanged', function (e, args) {
                //attrs.id = args.store.organization.alias;
                element.attr('id', args.store.organization.alias);
            });
        }
    }
    setStoreClass.$inject = ["storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin').config(_configureHttp);
    /* @ngInject */
    function _configureHttp(httpClientProvider, env) {
        httpClientProvider.baseUri = env.apiRoot;    //httpClientProvider.authTokenName = "token";
                                                     //httpClientProvider.authTokenType = "Bearer";
    }
    _configureHttp.$inject = ["httpClientProvider", "env"];
}());
(function () {
    'use strict';
    angular.module('qarin').constant('env', {
        apiRoot: 'http://localhost:3000'    //apiRoot: 'http://192.168.1.122:3000'
    });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFyZWFzL3RpY2tldHMvdGlja2V0cy5tb2R1bGUuanMiLCJhcmVhcy90aWNrZXRzL3RpY2tldHMuc2VydmljZS5qcyIsImFwcC5qcyIsImFyZWFzL3RpY2tldHMvdGlja2V0cy5yb3V0ZXMuanMiLCJhcmVhcy90aWNrZXRzL3RpY2tldC5jb250cm9sbGVyLmpzIiwiYXJlYXMvdGVtcC9vdXRzaWRlc2hlbGwuY29udHJvbGxlci5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0cy5tb2R1bGUuanMiLCJhcmVhcy9wcm9kdWN0cy9zZWFyY2guY29udHJvbGxlci5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3Quc2VydmljZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3QuY29udHJvbGxlci5qcyIsImFyZWFzL2xheW91dC9sb2NhdG9yLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbGF5b3V0LmNvbmZpZy5qcyIsImFyZWFzL2xheW91dC9oZWFkZXIuY29udHJvbGxlci5qcyIsImFyZWFzL2hvbWUvaG9tZS5tb2R1bGUuanMiLCJhcmVhcy9ob21lL2hvbWUucm91dGVzLmpzIiwiYXJlYXMvaG9tZS9Ib21lQ29udHJvbGxlci5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMubW9kdWxlLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5yb3V0ZXMuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3Iuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5tb2R1bGUuanMiLCJhcmVhcy9jaGF0L2NoYXRsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdC5yb3V0ZXMuanMiLCJhcmVhcy9jaGF0L0NoYXRDb250cm9sbGVyLmpzIiwic2VydmljZXMvdXRpbC5zZXJ2aWNlLmpzIiwic2VydmljZXMvc3RvcmVTZXJ2aWNlLmpzIiwic2VydmljZXMvc29ja2V0cy5qcyIsInNlcnZpY2VzL25vdGlmaWNhdGlvbi5zZXJ2aWNlLmpzIiwic2VydmljZXMvZ2VvTG9jYXRpb25TZXJ2aWNlLmpzIiwic2VydmljZXMvZGV2aWNlSW50ZXJjZXB0b3IuanMiLCJkaXJlY3RpdmVzL3FhU2V0U3RvcmVDbGFzcy5kaXJlY3RpdmUuanMiLCJjb25maWcvaHR0cC5qcyIsImNvbmZpZy9lbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsIlRpY2tldFNlcnZpY2UiLCJzdG9yZVNlcnZpY2UiLCJodHRwQ2xpZW50IiwidXRpbCIsInNvY2tldCIsInN0b3JlIiwiY3VycmVudCIsInNlcnZpY2UiLCJjcmVhdGUiLCJjcmVhdGVUaWNrZXQiLCJnZXQiLCJnZXRUaWNrZXQiLCJvbiIsImFkZEhhbmRsZXIiLCJpbml0IiwiaWQiLCJ1cmwiLCJqb2luIiwidGhlbiIsInJlcyIsImRhdGEiLCJwcm9kdWN0IiwicmVxdWVzdCIsInR5cGUiLCJwb3N0IiwiZSIsIm1lc3NhZ2UiLCJoYW5kbGVyIiwicmVtb3ZlTGlzdGVuZXIiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJzdGF0ZSIsImFic3RyYWN0Iiwidmlld3MiLCJ0ZW1wbGF0ZVVybCIsInBhcmVudCIsInRlbXBsYXRlIiwicnVuIiwiJHJvb3RTY29wZSIsIiRzdGF0ZSIsIiRvbiIsImV2ZW50IiwidW5mb3VuZFN0YXRlIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImNvbnNvbGUiLCJsb2ciLCJ0byIsInRvUGFyYW1zIiwib3B0aW9ucyIsInRvU3RhdGUiLCJlcnJvciIsIm5hbWUiLCJjb25maWd1cmVSb3V0ZXMiLCJjb250cm9sbGVyIiwiY29udHJvbGxlckFzIiwicmVzb2x2ZSIsInRpY2tldCIsInRpY2tldFNlcnZpY2UiLCIkc3RhdGVQYXJhbXMiLCJ0aWNrZXRJZCIsIlRpY2tldENvbnRyb2xsZXIiLCIkc2NvcGUiLCJ2bSIsImV4dGVuZCIsImNoYXQiLCJnb3RvQ2hhdCIsImdvIiwiY2hhdElkIiwidW5iaW5kIiwiT3V0c2lkZVNoZWxsQ29udHJvbGxlciIsInN0b3JhZ2VTZXJ2aWNlIiwibm9kZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsIndpbmRvdyIsImFkZFN0eWxlU3RyaW5nIiwic3RyIiwiaW5uZXJIVE1MIiwic2V0U3RvcmUiLCJfc2V0U3RvcmUiLCJzZXRTdG9yZVVzaW5nTG9jYXRpb24iLCJfc2V0U3RvcmVVc2luZ0xvY2F0aW9uIiwiZ2V0QnlJZCIsInNldCIsInJlbW92ZSIsImdldEN1cnJlbnRTdG9yZSIsIlNlYXJjaENvbnRyb2xsZXIiLCJxdWVyeSIsIiRsb2NhdGlvbiIsInByb2R1Y3RzIiwic2VhcmNoIiwiX3NlYXJjaCIsIl9pbml0IiwicmVsb2FkIiwicmVnaXN0ZXJSb3V0ZXMiLCJwcm9kdWN0U2VydmljZSIsInByb2R1Y3RJZCIsIlByb2R1Y3RTZXJ2aWNlIiwiX2dldFByb2R1Y3RCeUlkIiwiUHJvZHVjdENvbnRyb2xsZXIiLCJjaGF0U2VydmljZSIsImNyZWF0ZUNoYXQiLCJfY3JlYXRlQ2hhdCIsIl9pZCIsImNhdGNoIiwiZXgiLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJwcmV2ZW50RGVmYXVsdCIsInJldCIsImVyciIsImxhc3RFcnJvciIsIndhaXRpbmdGb3JWaWV3IiwiSGVhZGVyQ29udHJvbGxlciIsIm5vdGlmaWNhdGlvbnMiLCJub3RpZmljYXRpb24iLCJ1bnNoaWZ0IiwiYXJncyIsIkhvbWVDb250cm9sbGVyIiwiJGh0dHAiLCJlbnYiLCJyZXF1ZXN0SGVscCIsIl9yZXF1ZXN0SGVscCIsIkVycm9yQ29udHJvbGxlciIsIkVycm9yU2VydmljZSIsIkNoYXRMaXN0Q29udHJvbGxlciIsImNoYXRzIiwiX2NyZWF0ZU5ld0NoYXQiLCJvcHRzIiwicGFyYW1zIiwiZ2V0TXlDaGF0cyIsImFjdGl2ZUNoYXRzIiwiZm9yRWFjaCIsImMiLCJsYXN0TWVzc2FnZSIsInB1c2giLCJDaGF0RmFjdG9yeSIsInNlbmRNZXNzYWdlIiwiZ2V0Q2hhdEJ5SWQiLCJDaGF0IiwiJGVtaXQiLCJwYXJzZSIsIm1hcCIsIngiLCJteURldmljZUlkIiwib3RoZXJzIiwicGFydGljaXBhbnRzIiwiZGV2aWNlIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJtZXNzYWdlcyIsInNsaWNlIiwic2VuZCIsIm1zZyIsInRpbWUiLCJ1c2VyIiwic2VudCIsIlV0aWxTZXJ2aWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsIlN0b3JlU2VydmljZSIsImdlb0xvY2F0aW9uIiwiX2N1cnJlbnQiLCJhdmFpbGFibGVFdmVudHMiLCJfZ2V0QnlJZCIsIl9nZXRDdXJyZW50U3RvcmUiLCJfcmVnaXN0ZXJMaXN0ZW5lciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiX2dldF9jdXJyZW50IiwiX3NldF9jdXJyZW50IiwiZW51bWVyYWJsZSIsInZhbHVlIiwic3RvcmVkU3RvcmUiLCJnZXRHcHMiLCJncHMiLCJsYXQiLCJjb29yZHMiLCJsYXRpdHVkZSIsImxuZyIsImxvbmdpdHVkZSIsInJlc3BvbnNlIiwibGVuZ3RoIiwiaW5kZXhPZiIsIkVycm9yIiwic29ja2V0RmFjdG9yeSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJ1cmkiLCJhcGlSb290IiwiZGV2aWNlSWQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwiaW9Tb2NrZXQiLCJyZWdpc3RlciIsImVtaXQiLCJzdG9yZUlkIiwiYXBwIiwic29ja2V0QnVpbGRlciIsIk5vdGlmaWNhdGlvblNlcnZpY2UiLCJHZW9Mb2NhdGlvblNlcnZpY2UiLCIkcSIsIiR3aW5kb3ciLCJ3YXRjaGVyQ291bnQiLCJfY3VycmVudFBvc2l0aW9uIiwibmF2aWdhdG9yIiwiZ2VvbG9jYXRpb24iLCJyZWplY3QiLCJkZWZlciIsImdldEN1cnJlbnRQb3NpdGlvbiIsInBvcyIsIiRhcHBseSIsImNvZGUiLCJwcm9taXNlIiwiRGV2aWNlSW50ZXJjZXB0b3IiLCJhZGRJbnRlcmNlcHRvcnMiLCJoZWFkZXJzIiwiaW50ZXJjZXB0b3JzIiwiZGlyZWN0aXZlIiwic2V0U3RvcmVDbGFzcyIsImxpbmsiLCJfbGlua0ZuIiwic2NvcGUiLCJlbGVtZW50IiwiYXR0cnMiLCJhdHRyIiwib3JnYW5pemF0aW9uIiwiYWxpYXMiLCJfY29uZmlndXJlSHR0cCIsImh0dHBDbGllbnRQcm92aWRlciIsImJhc2VVcmkiLCJjb25zdGFudCJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxZQUFZO0lBQ1Q7SUFESkEsUUFBUUMsT0FBTyxpQkFBaUI7S0FHM0I7QUNITCxDQUFDLFlBQVk7SUFDVDtJQURKRCxRQUFRQyxPQUFPLGlCQUNiQyxRQUFRLGlCQUFpQkM7SUFFM0IsU0FBU0EsY0FBY0MsY0FBY0MsWUFBWUMsTUFBTUMsUUFBTztRQUU3RCxJQUFJQyxRQUFRSixhQUFhSztRQUV6QixJQUFJQyxVQUFVO1lBQ2JDLFFBQVFDO1lBQ1JDLEtBQUtDO1lBQ0xDLElBQUlDOztRQUdMQztRQUVBLE9BQU9QO1FBRVAsU0FBU0ksVUFBVUksSUFBRztZQUNyQixJQUFJQyxNQUFNYixLQUFLYyxLQUFLLFVBQVVaLE1BQU1VLElBQUksU0FBU0E7WUFFakQsT0FBT2IsV0FBV1EsSUFBSU0sS0FDckJFLEtBQUssVUFBU0MsS0FBSTtnQkFDbEIsT0FBT0EsSUFBSUM7OztRQUliLFNBQVNYLGFBQWFZLFNBQVE7WUFDN0IsSUFBSUMsVUFBVSxFQUNiQyxNQUFNO1lBR1AsSUFBSVAsTUFBTWIsS0FBS2MsS0FBSyxVQUFVWixNQUFNVSxJQUFJO1lBQ3hDLE9BQU9iLFdBQVdzQixLQUFLUixLQUFL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QU87Z0JBRXJCLElBQUcsQ0FBQ0EsVUFBVSxDQUFDQSxPQUFPcU07b0JBQ2xCLE9BQU9yTTtnQkFFWEEsT0FBT3FNLFFBQVEsY0FBY3hKLGVBQWVoRSxJQUFJO2dCQUNoRCxPQUFPbUI7Ozs7O0lBS25CLFNBQVNvTSxnQkFBZ0JsTSxlQUFjO1FBQ3RDQSxjQUFjb00sYUFBYW5GLEtBQUs7OztLQUg1QjtBQ2hCTCxDQUFDLFlBQVk7SUFDVDtJQURKbkosUUFBUUMsT0FBTyxTQUNkc08sVUFBVSxtQkFBbUJDOztJQUc5QixTQUFTQSxjQUFjcE8sY0FBYTtRQUVuQyxPQUFPLEVBQ05xTyxNQUFNQztRQUdQLFNBQVNBLFFBQVFDLE9BQU9DLFNBQVNDLE9BQU07WUFFdEN6TyxhQUFhVyxHQUFHLGdCQUFnQixVQUFTYSxHQUFHcUcsTUFBSzs7Z0JBRWhEMkcsUUFBUUUsS0FBSyxNQUFNN0csS0FBS3pILE1BQU11TyxhQUFhQzs7Ozs7S0FEekM7QUNiTCxDQUFDLFlBQVk7SUFDVDtJQURKaFAsUUFBUUMsT0FBTyxTQUNkK0IsT0FBT2lOOztJQUdSLFNBQVNBLGVBQWVDLG9CQUFvQjlHLEtBQUs7UUFDN0M4RyxtQkFBbUJDLFVBQVUvRyxJQUFJcUU7Ozs7S0FHaEM7QUNSTCxDQUFDLFlBQVk7SUFDVDtJQURKek0sUUFBUUMsT0FBTyxTQUNkbVAsU0FBUyxPQUFPO1FBQ2IzQyxTQUFTOztLQUdSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdxYXJpbi50aWNrZXRzJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi50aWNrZXRzJylcclxuXHQuZmFjdG9yeSgndGlja2V0U2VydmljZScsIFRpY2tldFNlcnZpY2UpO1xyXG5cclxuZnVuY3Rpb24gVGlja2V0U2VydmljZShzdG9yZVNlcnZpY2UsIGh0dHBDbGllbnQsIHV0aWwsIHNvY2tldCl7XHJcblxyXG5cdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGNyZWF0ZTogY3JlYXRlVGlja2V0LFxyXG5cdFx0Z2V0OiBnZXRUaWNrZXQsXHJcblx0XHRvbjogYWRkSGFuZGxlclxyXG5cdH07XHJcblxyXG5cdGluaXQoKTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIGdldFRpY2tldChpZCl7XHJcblx0XHR2YXIgdXJsID0gdXRpbC5qb2luKCdzdG9yZXMnLCBzdG9yZS5pZCwgJ3Rhc2tzJywgaWQpO1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCh1cmwpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNyZWF0ZVRpY2tldChwcm9kdWN0KXtcclxuXHRcdHZhciByZXF1ZXN0ID0ge1xyXG5cdFx0XHR0eXBlOiAncmVxdWVzdCdcdFx0XHRcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIHVybCA9IHV0aWwuam9pbignc3RvcmVzJywgc3RvcmUuaWQsICd0YXNrcycpO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHJlcXVlc3QpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbml0KHNlcnZpY2Upe1xyXG5cdFx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBzdG9yZSl7XHJcblx0XHRcdHN0b3JlID0gc3RvcmU7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGFkZEhhbmRsZXIobWVzc2FnZSwgaGFuZGxlcil7XHJcblx0XHRzb2NrZXQub24obWVzc2FnZSwgaGFuZGxlcik7XHJcblx0XHRcclxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0c29ja2V0LnJlbW92ZUxpc3RlbmVyKG1lc3NhZ2UsIGhhbmRsZXIpO1xyXG5cdFx0fVxyXG5cdH1cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4nLCBbICAgIFxyXG4gICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAncWFyaW4ucGFydGlhbHMnLFxyXG4gICAgJ3VpLnJvdXRlcicsXHJcbiAgICAnbmdBbmltYXRlJyxcclxuICAgICdidGZvcmQuc29ja2V0LWlvJyxcclxuXHJcbiAgICAncWFyaW4uaW50ZXJjZXB0b3JzJyxcclxuICAgICdxYXJpbi5lcnJvcnMnLFxyXG4gICAgXHJcbiAgICAncWFyaW4uaG9tZScsXHJcbiAgICAncWFyaW4ucHJvZHVjdHMnLFxyXG4gICAgJ3FhcmluLnRpY2tldHMnLFxyXG4gICAgJ3FhcmluLmNoYXQnXHJcbiAgICBdKVxyXG5cclxuXHJcbi5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAgIFxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld3M6IHtcclxuICAgICAgICAgICAgICAgICcnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb250cm9sbGVyOiAnUm9vdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xheW91dC9sYXlvdXQuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICxcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmaWNhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb250cm9sbGVyOiAnTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9ucy5odG1sJ1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2xheW91dCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgdWktdmlldz48L2Rpdj4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICA7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3Ipe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gdHJhbnNpdGlvbiB0byBzdGF0ZSAnICsgdG9TdGF0ZS5uYW1lKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd0aWNrZXQtaW5mbycsIHtcclxuXHRcdHVybDogJy90aWNrZXRzLzp0aWNrZXRJZCcsXHJcblx0XHRjb250cm9sbGVyOiAnVGlja2V0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90aWNrZXRzL3RpY2tldC1kZXRhaWxzLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHR0aWNrZXQ6IGZ1bmN0aW9uKHRpY2tldFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0dmFyIGlkID0gJHN0YXRlUGFyYW1zLnRpY2tldElkO1xyXG5cdFx0XHRcdHJldHVybiB0aWNrZXRTZXJ2aWNlLmdldChpZCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cdC5zdGF0ZSgndGlja2V0LWNyZWF0ZWQnLCB7XHJcblx0XHR1cmw6ICcvdGlja2V0cy86dGlja2V0SWQvY3JlYXRlZCcsXHJcblx0XHRjb250cm9sbGVyOiAnVGlja2V0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90aWNrZXRzL3RpY2tldC1jcmVhdGVkLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHR0aWNrZXQ6IGZ1bmN0aW9uKHRpY2tldFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0dmFyIGlkID0gJHN0YXRlUGFyYW1zLnRpY2tldElkO1xyXG5cdFx0XHRcdHJldHVybiB0aWNrZXRTZXJ2aWNlLmdldChpZCk7XHJcblx0XHRcdH1cclxuXHRcdH1cdFxyXG5cdH0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ1RpY2tldENvbnRyb2xsZXInLCBUaWNrZXRDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIFRpY2tldENvbnRyb2xsZXIoJHNjb3BlLCB0aWNrZXQsIHRpY2tldFNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHR0aWNrZXQ6IHRpY2tldCxcclxuXHRcdGNoYXQ6IGdvdG9DaGF0XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIGdvdG9DaGF0KCl7XHJcblx0XHRyZXR1cm4gJHN0YXRlLmdvKCdjaGF0Jywge2NoYXRJZDogdGlja2V0LmNoYXR9KTtcclxuXHR9XHJcblxyXG5cdHZhciB1bmJpbmQgPSB0aWNrZXRTZXJ2aWNlLm9uKCd0YXNrOmFzc2lnbmVkJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRjb25zb2xlLmxvZygndGFzazphc3NpZ25lZCcsIGRhdGEpO1xyXG5cdH0pO1xyXG5cclxuXHQkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCl7XHJcblx0XHRjb25zb2xlLmxvZygndGlja2V0LmNvbnRyb2xsZXIgLSBkZXN0cm95Jyk7XHJcblx0XHR1bmJpbmQoKTtcclxuXHR9KTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdPdXRzaWRlU2hlbGxDb250cm9sbGVyJywgT3V0c2lkZVNoZWxsQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBPdXRzaWRlU2hlbGxDb250cm9sbGVyKHN0b3JlU2VydmljZSwgc3RvcmFnZVNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuXHR2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcclxuXHR3aW5kb3cuYWRkU3R5bGVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcclxuXHRcdG5vZGUuaW5uZXJIVE1MID0gc3RyO1xyXG5cdH07XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNldFN0b3JlOiBfc2V0U3RvcmUsXHJcblx0XHRzZXRTdG9yZVVzaW5nTG9jYXRpb246IF9zZXRTdG9yZVVzaW5nTG9jYXRpb24sXHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRTdG9yZShpZCkge1x0XHRcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0QnlJZChpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmUpIHtcclxuXHRcdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudCA9IHN0b3JlO1xyXG5cdFx0XHRcdHN0b3JhZ2VTZXJ2aWNlLnNldCgnc3RvcmUnLCBpZCwgdHJ1ZSk7XHJcblxyXG5cdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gc3RvcmU7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX3NldFN0b3JlVXNpbmdMb2NhdGlvbigpIHtcclxuXHRcdFxyXG5cdFx0c3RvcmFnZVNlcnZpY2UucmVtb3ZlKCdzdG9yZScpO1xyXG5cdFx0cmV0dXJuIHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZSkge1xyXG5cclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHN0b3JlO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29udHJvbGxlcignTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBzb2NrZXQpIHtcclxuXHJcbiAgICAkc2NvcGUuY3VycmVudCA9IHt9O1xyXG4gICAgLy9ub3RpZmljYXRpb25Tb2NrZXRcclxuICAgIHNvY2tldC5vbignaGVscCcsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmN1cnJlbnQgPSBkYXRhO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0Lm9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHJcbiAgICB9KTtcclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBTZWFyY2hDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBTZWFyY2hDb250cm9sbGVyKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSwgcXVlcnksICRzdGF0ZSwgJGxvY2F0aW9uKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdHM6IFtdLFxyXG5cdFx0cXVlcnk6IHF1ZXJ5IHx8ICcnLFxyXG5cdFx0c2VhcmNoOiBfc2VhcmNoXHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCl7XHJcblx0XHQgaWYoIXZtLnF1ZXJ5KVxyXG5cdFx0IFx0cmV0dXJuO1xyXG5cdFx0Ly8gXHRfc2VhcmNoKCk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvcHJvZHVjdHM/c2VhcmNoPScgKyB2bS5xdWVyeTtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KHVybClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblx0XHRcdHZtLnByb2R1Y3RzID0gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZWFyY2goKXtcclxuXHJcblx0XHQvLyB2YXIgb3JpZ2luYWxVcmwgPSAkbG9jYXRpb24udXJsKCk7XHJcblx0XHQvLyB2YXIgdXJsID0gJHN0YXRlLmhyZWYoJ3NlYXJjaCcsIHtxdWVyeTogdm0ucXVlcnl9KTtcclxuXHRcdC8vIGlmKG9yaWdpbmFsVXJsICE9PSB1cmwpXHJcblx0XHQvLyBcdCRsb2NhdGlvbi51cmwodXJsKTtcclxuXHRcdC8vJGxvY2F0aW9uLnB1c2hcclxuXHRcdCRzdGF0ZS5nbygnc2VhcmNoJywge3F1ZXJ5OiB2bS5xdWVyeX0sIHtyZWxvYWQ6IHRydWV9KTtcclxuXHRcdFxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcblx0LmNvbmZpZyhyZWdpc3RlclJvdXRlcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gcmVnaXN0ZXJSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XHJcblx0XHR1cmw6ICcvc2VhcmNoP3F1ZXJ5JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Byb2R1Y3RzL3NlYXJjaC5odG1sJyxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0cXVlcnk6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0cmV0dXJuICRzdGF0ZVBhcmFtcy5xdWVyeTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0LnN0YXRlKCdwcm9kdWN0Jywge1xyXG5cdFx0dXJsOiAnL3Byb2R1Y3QvOnByb2R1Y3RJZCcsXHJcblx0XHRjb250cm9sbGVyOiAnUHJvZHVjdENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvcHJvZHVjdC5odG1sJyxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0cHJvZHVjdDogZnVuY3Rpb24ocHJvZHVjdFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0cmV0dXJuIHByb2R1Y3RTZXJ2aWNlLmdldCgkc3RhdGVQYXJhbXMucHJvZHVjdElkKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuXHQuZmFjdG9yeSgncHJvZHVjdFNlcnZpY2UnLCBQcm9kdWN0U2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBQcm9kdWN0U2VydmljZShodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRnZXQ6IF9nZXRQcm9kdWN0QnlJZFxyXG5cdH07XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBfZ2V0UHJvZHVjdEJ5SWQoaWQpIHtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9wcm9kdWN0cy8nICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgUHJvZHVjdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFByb2R1Y3RDb250cm9sbGVyKHByb2R1Y3RTZXJ2aWNlLCBwcm9kdWN0LCAkc3RhdGUsIGNoYXRTZXJ2aWNlKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdDogcHJvZHVjdCxcclxuXHRcdGNyZWF0ZUNoYXQ6IF9jcmVhdGVDaGF0XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9jcmVhdGVDaGF0KCl7XHJcblxyXG5cdFx0Y2hhdFNlcnZpY2UuY3JlYXRlKHtwcm9kdWN0OiBwcm9kdWN0Ll9pZH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhleCk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIHN0b3JlU2VydmljZSwgZXJyb3JTZXJ2aWNlKSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdC8vIGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdC8vIFx0cmV0dXJuO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cdFx0aWYoc3RvcmUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0JHN0YXRlLmdvKHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuXHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xyXG5cdFx0XHRlcnJvclNlcnZpY2UubGFzdEVycm9yID0gZXJyO1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2Vycm9yJyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdC8vIFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHQvLyBcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHQvLyBcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIHNvY2tldCwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuXHRcdG5vdGlmaWNhdGlvbnM6IFtdXHJcblx0fSk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuXHRcdHZhciBub3RpZmljYXRpb24gPSB7XHJcblx0XHRcdG5hbWU6ICdtZXNzYWdlJyxcclxuXHRcdFx0ZGF0YTogZGF0YSxcclxuXHRcdFx0Z286IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdjaGF0KHtpZDogZGF0YS5jaGF0fSknKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHZtLm5vdGlmaWNhdGlvbnMudW5zaGlmdChub3RpZmljYXRpb24pO1xyXG5cclxuXHR9KTtcclxuXHJcblx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKSB7XHJcblx0XHR2bS5zdG9yZSA9IGFyZ3Muc3RvcmU7XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uaG9tZScsIFsndWkucm91dGVyJ10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyXHJcblx0XHQuc3RhdGUoJ2hvbWUnLCB7XHJcblx0XHRcdHVybDogJy8nLFxyXG5cdFx0XHRwYXJlbnQ6ICdsYXlvdXQnLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9ob21lL2hvbWUuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXHJcblx0XHRcdGNvbnRyb2xsZXJBczogJ3ZtJ1xyXG5cdFx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uaG9tZScpXHJcbiAgICAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBIb21lQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBIb21lQ29udHJvbGxlcigkc2NvcGUsICRodHRwLCBlbnYsIHNvY2tldCwgc3RvcmVTZXJ2aWNlLCB0aWNrZXRTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHAgICAgICAgIFxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gX3JlcXVlc3RIZWxwKCkgeyBcclxuICAgICAgICAvL3JldHVybiBzdG9yZVNlcnZpY2UucmVxdWVzdEhlbHAoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRpY2tldFNlcnZpY2UuY3JlYXRlKClcclxuICAgICAgICAudGhlbihmdW5jdGlvbih0aWNrZXQpe1xyXG4gICAgICAgICAgICByZXR1cm4gJHN0YXRlLmdvKCd0aWNrZXQtY3JlYXRlZCcsIHt0aWNrZXRJZDogdGlja2V0Ll9pZH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3JlU2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgZnVuY3Rpb24oZSwgYXJncyl7XHJcbiAgICAgICAgdm0uc3RvcmUgPSBhcmdzLnN0b3JlO1xyXG4gICAgfSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Vycm9yJywge1xyXG5cdFx0dXJsOiAnL2Vycm9yJyxcclxuXHRcdHBhcmVudDogJ3Jvb3QnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0Vycm9yc0NvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZXJyb3JzL2Vycm9yLmh0bWwnXHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29udHJvbGxlcignRXJyb3JDb250cm9sbGVyJywgRXJyb3JDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBFcnJvckNvbnRyb2xsZXIoZXJyb3JTZXJ2aWNlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGVycm9yOiBlcnJvclNlcnZpY2UubGFzdEVycm9yXHJcblx0fSk7XHJcblxyXG4kcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuLmZhY3RvcnkoJ2Vycm9yU2VydmljZScsIEVycm9yU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JTZXJ2aWNlKCl7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0bGFzdEVycm9yOiBudWxsXHJcblx0fTtcclxuXHRyZXR1cm4gc2VydmljZTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5jaGF0JyxbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsICRzdGF0ZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGNoYXRTZXJ2aWNlLmdldE15Q2hhdHMoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY2hhdHMpe1xyXG5cdFx0XHR2YXIgYWN0aXZlQ2hhdHMgPSBbXTtcclxuXHRcdFx0Y2hhdHMuZm9yRWFjaChmdW5jdGlvbihjKXtcclxuXHRcdFx0XHRpZihjLmxhc3RNZXNzYWdlKVxyXG5cdFx0XHRcdFx0YWN0aXZlQ2hhdHMucHVzaChjKTtcclxuXHRcdFx0fSlcclxuXHRcdFx0dm0uY2hhdHMgPSBhY3RpdmVDaGF0cztcclxuXHRcdH0pXHJcblxyXG5cdFx0Ly8gaHR0cENsaWVudC5nZXQoJy91c2Vycy9tZS9jaGF0cycsIG9wdHMpXHJcblx0XHQvLyBcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0Ly8gXHRcdHZtLmNoYXRzID0gcGFyc2UocmVzLmRhdGEpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9jcmVhdGVOZXdDaGF0KCl7XHJcblxyXG5cdFx0Y2hhdFNlcnZpY2UuY3JlYXRlKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGNoYXQpe1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2NoYXQnLCB7Y2hhdElkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcpXHJcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0Ly8gXHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IHJlcy5kYXRhLl9pZH0pO1xyXG5cdFx0Ly8gfSk7XHJcblx0fVxyXG59XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5jaGF0JylcclxuXHQuZmFjdG9yeSgnY2hhdFNlcnZpY2UnLCBDaGF0RmFjdG9yeSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdEZhY3RvcnkoJHJvb3RTY29wZSwgaHR0cENsaWVudCwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRzZW5kTWVzc2FnZTogc2VuZE1lc3NhZ2UsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVDaGF0LFxyXG5cdFx0Z2V0QnlJZDogZ2V0Q2hhdEJ5SWQsXHJcblx0XHRnZXRNeUNoYXRzOiBnZXRNeUNoYXRzXHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoaWQsIG1lc3NhZ2UpIHtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9jaGF0LycgKyBpZCArICcvbWVzc2FnZXMnO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHtcclxuXHRcdFx0XHRtZXNzYWdlOiBtZXNzYWdlXHJcblx0XHRcdH0pXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlQ2hhdChvcHRzKSB7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL2NoYXQnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0Q2hhdEJ5SWQoaWQpIHtcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gbmV3IENoYXQocmVzLmRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKSB7XHJcblx0XHRzb2NrZXQub24oJ2NoYXQ6bWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ2NoYXQtbWVzc2FnZScsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRNeUNoYXRzKCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2UocmVzLmRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlKGRhdGEpIHtcclxuXHJcblx0XHRyZXR1cm4gZGF0YS5tYXAoZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHRcdC8vIGNvcHkgcmF3IHByb3BlcnRpZXNcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIGRhdGEpO1xyXG5cclxuXHRcdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHRcdHZhciBvdGhlcnMgPSBbXTtcclxuXHJcblx0XHRkYXRhLnBhcnRpY2lwYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcclxuXHRcdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHJcblx0XHRcdG90aGVycy5wdXNoKHguZmlyc3ROYW1lKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMudXNlcnMgPSBvdGhlcnMuam9pbignLCAnKTtcclxuXHJcblx0XHR0aGlzLmxhc3RNZXNzYWdlID0gZGF0YS5tZXNzYWdlcy5zbGljZSgtMSlbMF07XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5jaGF0JylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG5cdFx0XHR1cmw6ICcvY2hhdCcsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG5cdFx0XHRjb250cm9sbGVyQXM6ICd2bSdcclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2NoYXQnLCB7XHJcblx0XHRcdHVybDogJy9jaGF0LzpjaGF0SWQnLFxyXG5cdFx0XHRwYXJlbnQ6ICdsYXlvdXQnLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXQuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdDaGF0Q29udHJvbGxlcicsXHJcblx0XHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJHN0YXRlUGFyYW1zLmNoYXRJZDtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGNoYXQ6IGZ1bmN0aW9uKGNoYXRJZCwgY2hhdFNlcnZpY2UpIHtcclxuXHRcdFx0XHRcdHJldHVybiBjaGF0U2VydmljZS5nZXRCeUlkKGNoYXRJZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0LCBodHRwQ2xpZW50LCAkcm9vdFNjb3BlLCBjaGF0U2VydmljZSkge1xyXG5cclxuXHRcdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdFx0Y2hhdDogY2hhdCxcclxuXHRcdFx0c2VuZDogc2VuZE1lc3NhZ2UsXHJcblx0XHRcdG1lc3NhZ2U6ICcnLFxyXG5cdFx0XHRwcm9kdWN0OiBudWxsXHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGNoYXRJZClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHQvLyBcdFx0dm0uY2hhdCA9IHJlcy5kYXRhO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHJcblx0XHQkcm9vdFNjb3BlLiRvbignY2hhdC1tZXNzYWdlJywgZnVuY3Rpb24oZSwgbXNnKSB7XHJcblx0XHRcdHZtLmNoYXQubWVzc2FnZXMucHVzaChtc2cpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKSB7XHJcblx0XHRcdHZhciBtZXNzYWdlID0gdm0ubWVzc2FnZTtcclxuXHRcdFx0dm0ubWVzc2FnZSA9ICcnO1xyXG5cclxuXHRcdFx0Y2hhdFNlcnZpY2Uuc2VuZE1lc3NhZ2UoY2hhdC5faWQsIG1lc3NhZ2UpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uc2VydmljZSgndXRpbCcsIFV0aWxTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFV0aWxTZXJ2aWNlKCl7XHJcblxyXG5cdHRoaXMuam9pbiA9IGZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHRcdHJldHVybiAnLycgKyBhcmdzLmpvaW4oJy8nKTtcclxuXHR9O1xyXG5cdFxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuZmFjdG9yeSgnc3RvcmVTZXJ2aWNlJywgU3RvcmVTZXJ2aWNlKTtcclxuXHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGdlb0xvY2F0aW9uLCBodHRwQ2xpZW50LCAkcm9vdFNjb3BlLCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuXHR2YXIgX2N1cnJlbnQgPSBudWxsO1xyXG5cdHZhciBhdmFpbGFibGVFdmVudHMgPSBbJ3N0b3JlQ2hhbmdlZCddO1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldEJ5SWQ6IF9nZXRCeUlkLFxyXG5cdFx0Z2V0Q3VycmVudFN0b3JlOiBfZ2V0Q3VycmVudFN0b3JlLFxyXG5cdFx0b246IF9yZWdpc3Rlckxpc3RlbmVyLFxyXG5cdFx0cmVxdWVzdEhlbHA6IHJlcXVlc3RIZWxwXHJcblx0fTtcclxuXHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50Jywge1xyXG5cdFx0Z2V0OiBfZ2V0X2N1cnJlbnQsXHJcblx0XHRzZXQ6IF9zZXRfY3VycmVudCxcclxuXHRcdGVudW1lcmFibGU6IHRydWVcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIHJlcXVlc3RIZWxwKCkge1xyXG5cdFx0dmFyIHJlcXVlc3QgPSB7XHJcblx0XHRcdHR5cGU6ICdyZXF1ZXN0JyxcclxuXHRcdFx0Ly9jdXN0b21lcjogc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKSxcclxuXHRcdH07XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvc3RvcmVzLycgKyBfY3VycmVudC5pZCArICcvdGFza3MnO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHJlcXVlc3QpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfZ2V0X2N1cnJlbnQoKSB7XHJcblx0XHRyZXR1cm4gX2N1cnJlbnQ7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfc2V0X2N1cnJlbnQodmFsdWUpIHtcclxuXHRcdF9jdXJyZW50ID0gdmFsdWU7XHJcblx0XHQkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7XHJcblx0XHRcdHN0b3JlOiBfY3VycmVudFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfZ2V0QnlJZChpZCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRDdXJyZW50U3RvcmUoKSB7XHJcblxyXG5cdFx0dmFyIHN0b3JlZFN0b3JlID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdzdG9yZScpO1xyXG5cdFx0aWYgKHN0b3JlZFN0b3JlKSB7XHJcblxyXG5cdFx0XHRyZXR1cm4gX2dldEJ5SWQoc3RvcmVkU3RvcmUpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmUpIHtcclxuXHRcdFx0XHRcdF9jdXJyZW50ID0gc3RvcmU7XHJcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRcdHN0b3JlOiBfY3VycmVudFxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGdlb0xvY2F0aW9uLmdldEdwcygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGdwcykge1xyXG5cclxuXHRcdFx0XHR2YXIgcGFyYW1zID0ge1xyXG5cdFx0XHRcdFx0bGF0OiBncHMuY29vcmRzLmxhdGl0dWRlLFxyXG5cdFx0XHRcdFx0bG5nOiBncHMuY29vcmRzLmxvbmdpdHVkZVxyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL2xvY2F0aW9ucycsIHtcclxuXHRcdFx0XHRcdFx0cGFyYW1zOiBwYXJhbXNcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPj0gMSkge1xyXG5cdFx0XHRcdFx0XHRcdF9jdXJyZW50ID0gcmVzcG9uc2UuZGF0YVswXTtcclxuXHJcblx0XHRcdFx0XHRcdFx0JHJvb3RTY29wZS4kZW1pdCgnc3RvcmVDaGFuZ2VkJywge1xyXG5cdFx0XHRcdFx0XHRcdFx0c3RvcmU6IF9jdXJyZW50XHJcblx0XHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0cmV0dXJuIF9jdXJyZW50O1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX3JlZ2lzdGVyTGlzdGVuZXIobmFtZSwgaGFuZGxlcikge1xyXG5cclxuXHRcdGlmIChhdmFpbGFibGVFdmVudHMuaW5kZXhPZihuYW1lKSA9PT0gLTEpXHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignVGhlIGV2ZW50IFxcJycgKyBuYW1lICsgJ1xcJyBpcyBub3QgYXZhaWxhYmxlIG9uIHN0b3JlU2VydmljZS4nKTtcclxuXHJcblx0XHRyZXR1cm4gJHJvb3RTY29wZS4kb24obmFtZSwgaGFuZGxlcik7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzb2NrZXRCdWlsZGVyJywgZnVuY3Rpb24gKHNvY2tldEZhY3RvcnksIGVudiwgc3RvcmFnZVNlcnZpY2UsIHN0b3JlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB1cmkgPSBlbnYuYXBpUm9vdDtcclxuICAgICAgICAgICAgaWYobmFtZXNwYWNlKVxyXG4gICAgICAgICAgICAgICAgdXJpICs9IG5hbWVzcGFjZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2VJZCA9IHN0b3JhZ2VTZXJ2aWNlLmdldCgnZGV2aWNlLWlkJyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbXlJb1NvY2tldCA9IGlvLmNvbm5lY3QodXJpLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlSWRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHNvY2tldC5pbyA9IG15SW9Tb2NrZXQ7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZWdpc3RlcigpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy92YXIgdXNlciA9IHNlY3VyaXR5U2VydmljZS5jdXJyZW50VXNlcigpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlSWQ6IHN0b3JlU2VydmljZS5jdXJyZW50ICYmIHN0b3JlU2VydmljZS5jdXJyZW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vdXNlcklkOiB1c2VyICYmIHVzZXIuX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldmljZUlkOiBkZXZpY2VJZCxcclxuICAgICAgICAgICAgICAgICAgICBhcHA6ICdxYXJpbidcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzb2NrZXQub24oJ2Nvbm5lY3QnLCByZWdpc3Rlcik7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIHJlZ2lzdGVyKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBzb2NrZXQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ25vdGlmaWNhdGlvblNlcnZpY2UnLCBOb3RpZmljYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBOb3RpZmljYXRpb25TZXJ2aWNlKCRyb290U2NvcGUsIHNvY2tldEJ1aWxkZXIpe1xyXG5cclxuXHR2YXIgc29ja2V0ID0gc29ja2V0QnVpbGRlcignJyk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdC8vXHQkcm9vdFNjb3BlXHJcblx0fSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ2dlb0xvY2F0aW9uJywgR2VvTG9jYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBHZW9Mb2NhdGlvblNlcnZpY2UoJHEsICR3aW5kb3csICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgd2F0Y2hlckNvdW50ID0gMDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldEdwczogX2N1cnJlbnRQb3NpdGlvbixcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4LmNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBkZWZlci5yZWplY3QoJ1Blcm1pc3Npb24gRGVuaWVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQb3NpdGlvbiBVbmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGRlZmVyLnJlamVjdCgnVGltZW91dCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWZlci5yZWplY3QoJ1Vua293bicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4uaW50ZXJjZXB0b3JzJywgW10pXHJcblx0LmZhY3RvcnkoJ2RldmljZUludGVyY2VwdG9yJywgRGV2aWNlSW50ZXJjZXB0b3IpXHJcbiAgICAuY29uZmlnKGFkZEludGVyY2VwdG9ycyk7XHJcblxyXG5mdW5jdGlvbiBEZXZpY2VJbnRlcmNlcHRvcigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG5cdHJldHVybiB7XHJcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCFjb25maWcgfHwgIWNvbmZpZy5oZWFkZXJzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWyd4LWRldmljZSddID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UtaWQnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRJbnRlcmNlcHRvcnMoJGh0dHBQcm92aWRlcil7XHJcblx0JGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZGV2aWNlSW50ZXJjZXB0b3InKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5kaXJlY3RpdmUoJ3FhU2V0U3RvcmVDbGFzcycsIHNldFN0b3JlQ2xhc3MpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIHNldFN0b3JlQ2xhc3Moc3RvcmVTZXJ2aWNlKXtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpbms6IF9saW5rRm5cclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBfbGlua0ZuKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcblxyXG5cdFx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKXtcclxuXHRcdFx0Ly9hdHRycy5pZCA9IGFyZ3Muc3RvcmUub3JnYW5pemF0aW9uLmFsaWFzO1xyXG5cdFx0XHRlbGVtZW50LmF0dHIoXCJpZFwiLCBhcmdzLnN0b3JlLm9yZ2FuaXphdGlvbi5hbGlhcyk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29uZmlnKF9jb25maWd1cmVIdHRwKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBfY29uZmlndXJlSHR0cChodHRwQ2xpZW50UHJvdmlkZXIsIGVudikge1xyXG4gICAgaHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBlbnYuYXBpUm9vdDtcclxuICAgIC8vaHR0cENsaWVudFByb3ZpZGVyLmF1dGhUb2tlbk5hbWUgPSBcInRva2VuXCI7XHJcbiAgICAvL2h0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5UeXBlID0gXCJCZWFyZXJcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxuICAgIC8vYXBpUm9vdDogJ2h0dHA6Ly8xOTIuMTY4LjEuMTIyOjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==