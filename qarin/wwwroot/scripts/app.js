(function () {
    'use strict';
    angular.module('qarin.tickets', []);
}());
(function () {
    'use strict';
    angular.module('qarin.tickets').factory('ticketService', TicketService);
    function TicketService(storeService, httpClient, util) {
        var store = storeService.current;
        var service = {
            create: createTicket,
            get: getTicket
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
    }
    TicketService.$inject = ["storeService", "httpClient", "util"];
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
            template: '<ui-view></ui-view>'
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
    function TicketController(ticket, ticketService, $state, socket) {
        var vm = angular.extend(this, {
            ticket: ticket,
            chat: gotoChat
        });
        function gotoChat() {
            return $state.go('chat', { chatId: ticket.chat });
        }
        socket.on('task:assigned', function (data) {
            console.log('task:assigned', data);
        });
    }
    TicketController.$inject = ["ticket", "ticketService", "$state", "socket"];
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
                vm.chats = chats;
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
            socket.on('message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
        }
        function getMyChats() {
            return httpClient.get('/users/me/chats', opts).then(function (res) {
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
            $rootScope.$on(name, handler);
        }
    }
    StoreService.$inject = ["geoLocation", "httpClient", "$rootScope", "storageService"];
}());
(function () {
    'use strict';
    angular.module('qarin').factory('socketBuilder', ["socketFactory", "env", "storageService", function (socketFactory, env, storageService) {
        var builder = function (namespace) {
            var uri = env.apiRoot;
            if (namespace)
                uri += namespace;
            var deviceId = storageService.get('device');
            var myIoSocket = io.connect(uri, { query: 'device=' + deviceId });
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
                config.headers['x-device'] = storageService.get('device');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFyZWFzL3RpY2tldHMvdGlja2V0cy5tb2R1bGUuanMiLCJhcmVhcy90aWNrZXRzL3RpY2tldHMuc2VydmljZS5qcyIsImFwcC5qcyIsImFyZWFzL3RpY2tldHMvdGlja2V0cy5yb3V0ZXMuanMiLCJhcmVhcy90aWNrZXRzL3RpY2tldC5jb250cm9sbGVyLmpzIiwiYXJlYXMvY2hhdC9jaGF0Lm1vZHVsZS5qcyIsImFyZWFzL2NoYXQvY2hhdGxpc3QuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnJvdXRlcy5qcyIsImFyZWFzL2NoYXQvQ2hhdENvbnRyb2xsZXIuanMiLCJhcmVhcy90ZW1wL291dHNpZGVzaGVsbC5jb250cm9sbGVyLmpzIiwiYXJlYXMvcHJvZHVjdHMvcHJvZHVjdHMubW9kdWxlLmpzIiwiYXJlYXMvcHJvZHVjdHMvc2VhcmNoLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0cy5yb3V0ZXMuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0LnNlcnZpY2UuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9ub3RpZmljYXRpb25zL05vdGlmaWNhdGlvbnNDb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xvY2F0b3IuY29udHJvbGxlci5qcyIsImFyZWFzL2xheW91dC9sYXlvdXQuY29uZmlnLmpzIiwiYXJlYXMvbGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5tb2R1bGUuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLnJvdXRlcy5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMuY29udHJvbGxlci5qcyIsImFyZWFzL2Vycm9ycy9lcnJvci5zZXJ2aWNlLmpzIiwiYXJlYXMvaG9tZS9ob21lLm1vZHVsZS5qcyIsImFyZWFzL2hvbWUvaG9tZS5yb3V0ZXMuanMiLCJhcmVhcy9ob21lL0hvbWVDb250cm9sbGVyLmpzIiwic2VydmljZXMvdXRpbC5zZXJ2aWNlLmpzIiwic2VydmljZXMvc3RvcmVTZXJ2aWNlLmpzIiwic2VydmljZXMvc29ja2V0cy5qcyIsInNlcnZpY2VzL25vdGlmaWNhdGlvbi5zZXJ2aWNlLmpzIiwic2VydmljZXMvZ2VvTG9jYXRpb25TZXJ2aWNlLmpzIiwic2VydmljZXMvZGV2aWNlSW50ZXJjZXB0b3IuanMiLCJkaXJlY3RpdmVzL3FhU2V0U3RvcmVDbGFzcy5kaXJlY3RpdmUuanMiLCJjb25maWcvaHR0cC5qcyIsImNvbmZpZy9lbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiZmFjdG9yeSIsIlRpY2tldFNlcnZpY2UiLCJzdG9yZVNlcnZpY2UiLCJodHRwQ2xpZW50IiwidXRpbCIsInN0b3JlIiwiY3VycmVudCIsInNlcnZpY2UiLCJjcmVhdGUiLCJjcmVhdGVUaWNrZXQiLCJnZXQiLCJnZXRUaWNrZXQiLCJpbml0IiwiaWQiLCJ1cmwiLCJqb2luIiwidGhlbiIsInJlcyIsImRhdGEiLCJwcm9kdWN0IiwicmVxdWVzdCIsInR5cGUiLCJwb3N0Iiwib24iLCJlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkaHR0cFByb3ZpZGVyIiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwic3RhdGUiLCJhYnN0cmFjdCIsInZpZXdzIiwidGVtcGxhdGVVcmwiLCJwYXJlbnQiLCJ0ZW1wbGF0ZSIsInJ1biIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkb24iLCJldmVudCIsInVuZm91bmRTdGF0ZSIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJ0b1BhcmFtcyIsIm9wdGlvbnMiLCJ0b1N0YXRlIiwiZXJyb3IiLCJuYW1lIiwiY29uZmlndXJlUm91dGVzIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInJlc29sdmUiLCJ0aWNrZXQiLCJ0aWNrZXRTZXJ2aWNlIiwiJHN0YXRlUGFyYW1zIiwidGlja2V0SWQiLCJUaWNrZXRDb250cm9sbGVyIiwic29ja2V0Iiwidm0iLCJleHRlbmQiLCJjaGF0IiwiZ290b0NoYXQiLCJnbyIsImNoYXRJZCIsIkNoYXRMaXN0Q29udHJvbGxlciIsImNoYXRTZXJ2aWNlIiwiY2hhdHMiLCJfY3JlYXRlTmV3Q2hhdCIsIl9pbml0Iiwib3B0cyIsInBhcmFtcyIsImdldE15Q2hhdHMiLCJfaWQiLCJDaGF0RmFjdG9yeSIsInNlbmRNZXNzYWdlIiwiX2NyZWF0ZUNoYXQiLCJnZXRCeUlkIiwiZ2V0Q2hhdEJ5SWQiLCJtZXNzYWdlIiwiQ2hhdCIsIiRlbWl0IiwicGFyc2UiLCJtYXAiLCJ4IiwibXlEZXZpY2VJZCIsIm90aGVycyIsInBhcnRpY2lwYW50cyIsImZvckVhY2giLCJkZXZpY2UiLCJwdXNoIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJsYXN0TWVzc2FnZSIsIm1lc3NhZ2VzIiwic2xpY2UiLCJzZW5kIiwibXNnIiwidGltZSIsInVzZXIiLCJzZW50IiwiT3V0c2lkZVNoZWxsQ29udHJvbGxlciIsInN0b3JhZ2VTZXJ2aWNlIiwibm9kZSIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsIndpbmRvdyIsImFkZFN0eWxlU3RyaW5nIiwic3RyIiwiaW5uZXJIVE1MIiwic2V0U3RvcmUiLCJfc2V0U3RvcmUiLCJzZXRTdG9yZVVzaW5nTG9jYXRpb24iLCJfc2V0U3RvcmVVc2luZ0xvY2F0aW9uIiwic2V0IiwicmVtb3ZlIiwiZ2V0Q3VycmVudFN0b3JlIiwiU2VhcmNoQ29udHJvbGxlciIsInF1ZXJ5IiwiJGxvY2F0aW9uIiwicHJvZHVjdHMiLCJzZWFyY2giLCJfc2VhcmNoIiwicmVsb2FkIiwicmVnaXN0ZXJSb3V0ZXMiLCJwcm9kdWN0U2VydmljZSIsInByb2R1Y3RJZCIsIlByb2R1Y3RTZXJ2aWNlIiwiX2dldFByb2R1Y3RCeUlkIiwiUHJvZHVjdENvbnRyb2xsZXIiLCJjcmVhdGVDaGF0IiwiY2F0Y2giLCJleCIsIiRzY29wZSIsIkxvY2F0b3JDb250cm9sbGVyIiwiZW5zdXJlQXV0aGVudGljYXRlZCIsIiR0aW1lb3V0IiwiZXJyb3JTZXJ2aWNlIiwic2hvd1NwbGFzaCIsInByZXZlbnREZWZhdWx0IiwicmV0IiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsInVuc2hpZnQiLCJhcmdzIiwiRXJyb3JDb250cm9sbGVyIiwiRXJyb3JTZXJ2aWNlIiwiSG9tZUNvbnRyb2xsZXIiLCIkaHR0cCIsImVudiIsInJlcXVlc3RIZWxwIiwiX3JlcXVlc3RIZWxwIiwiVXRpbFNlcnZpY2UiLCJjYWxsIiwiYXJndW1lbnRzIiwiU3RvcmVTZXJ2aWNlIiwiZ2VvTG9jYXRpb24iLCJfY3VycmVudCIsImF2YWlsYWJsZUV2ZW50cyIsIl9nZXRCeUlkIiwiX2dldEN1cnJlbnRTdG9yZSIsIl9yZWdpc3Rlckxpc3RlbmVyIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJfZ2V0X2N1cnJlbnQiLCJfc2V0X2N1cnJlbnQiLCJlbnVtZXJhYmxlIiwidmFsdWUiLCJzdG9yZWRTdG9yZSIsImdldEdwcyIsImdwcyIsImxhdCIsImNvb3JkcyIsImxhdGl0dWRlIiwibG5nIiwibG9uZ2l0dWRlIiwicmVzcG9uc2UiLCJsZW5ndGgiLCJoYW5kbGVyIiwiaW5kZXhPZiIsIkVycm9yIiwic29ja2V0RmFjdG9yeSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJ1cmkiLCJhcGlSb290IiwiZGV2aWNlSWQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJOb3RpZmljYXRpb25TZXJ2aWNlIiwiR2VvTG9jYXRpb25TZXJ2aWNlIiwiJHEiLCIkd2luZG93Iiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCJwb3MiLCIkYXBwbHkiLCJjb2RlIiwicHJvbWlzZSIsIkRldmljZUludGVyY2VwdG9yIiwiYWRkSW50ZXJjZXB0b3JzIiwiaGVhZGVycyIsImludGVyY2VwdG9ycyIsImRpcmVjdGl2ZSIsInNldFN0b3JlQ2xhc3MiLCJsaW5rIiwiX2xpbmtGbiIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwiYXR0ciIsIm9yZ2FuaXphdGlvbiIsImFsaWFzIiwiX2NvbmZpZ3VyZUh0dHAiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCJiYXNlVXJpIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBREpBLFFBQVFDLE9BQU8saUJBQWlCO0tBRzNCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxpQkFDYkMsUUFBUSxpQkFBaUJDO0lBRTNCLFNBQVNBLGNBQWNDLGNBQWNDLFlBQVlDLE1BQUs7UUFFckQsSUFBSUMsUUFBUUgsYUFBYUk7UUFFekIsSUFBSUMsVUFBVTtZQUNiQyxRQUFRQztZQUNSQyxLQUFLQzs7UUFHTkM7UUFFQSxPQUFPTDtRQUVQLFNBQVNJLFVBQVVFLElBQUc7WUFDckIsSUFBSUMsTUFBTVYsS0FBS1csS0FBSyxVQUFVVixNQUFNUSxJQUFJLFNBQVNBO1lBRWpELE9BQU9WLFdBQVdPLElBQUlJLEtBQ3JCRSxLQUFLLFVBQVNDLEtBQUk7Z0JBQ2xCLE9BQU9BLElBQUlDOzs7UUFJYixTQUFTVCxhQUFhVSxTQUFRO1lBQzdCLElBQUlDLFVBQVUsRUFDYkMsTUFBTTtZQUdQLElBQUlQLE1BQU1WLEtBQUtXLEtBQUssVUFBVVYsTUFBTVEsSUFBSTtZQUN4QyxPQUFPVixXQUFXbUIsS0FBS1IsS0FBS00sU0FDMUJKLEtBQUssVUFBU0MsS0FBSztnQkFDbkIsT0FBT0EsSUFBSUM7OztRQUlkLFNBQVNOLEtBQUtMLFNBQVE7WUFDckJMLGFBQWFxQixHQUFHLGdCQUFnQixVQUFT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TSxRQUFRQyxPQUFPLFNBQ2QyTyxTQUFTLE9BQU87UUFDYnhDLFNBQVM7O0tBR1IiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnRpY2tldHMnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnRpY2tldHMnKVxyXG5cdC5mYWN0b3J5KCd0aWNrZXRTZXJ2aWNlJywgVGlja2V0U2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBUaWNrZXRTZXJ2aWNlKHN0b3JlU2VydmljZSwgaHR0cENsaWVudCwgdXRpbCl7XHJcblxyXG5cdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGNyZWF0ZTogY3JlYXRlVGlja2V0LFxyXG5cdFx0Z2V0OiBnZXRUaWNrZXRcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBnZXRUaWNrZXQoaWQpe1xyXG5cdFx0dmFyIHVybCA9IHV0aWwuam9pbignc3RvcmVzJywgc3RvcmUuaWQsICd0YXNrcycsIGlkKTtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQodXJsKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjcmVhdGVUaWNrZXQocHJvZHVjdCl7XHJcblx0XHR2YXIgcmVxdWVzdCA9IHtcclxuXHRcdFx0dHlwZTogJ3JlcXVlc3QnXHRcdFx0XHJcblx0XHR9O1xyXG5cclxuXHRcdHZhciB1cmwgPSB1dGlsLmpvaW4oJ3N0b3JlcycsIHN0b3JlLmlkLCAndGFza3MnKTtcclxuXHRcdHJldHVybiBodHRwQ2xpZW50LnBvc3QodXJsLCByZXF1ZXN0KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdChzZXJ2aWNlKXtcclxuXHRcdHN0b3JlU2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgZnVuY3Rpb24oZSwgc3RvcmUpe1xyXG5cdFx0XHRzdG9yZSA9IHN0b3JlO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4nLCBbICAgIFxyXG4gICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAncWFyaW4ucGFydGlhbHMnLFxyXG4gICAgJ3VpLnJvdXRlcicsXHJcbiAgICAnbmdBbmltYXRlJyxcclxuICAgICdidGZvcmQuc29ja2V0LWlvJyxcclxuXHJcbiAgICAncWFyaW4uaW50ZXJjZXB0b3JzJyxcclxuICAgICdxYXJpbi5lcnJvcnMnLFxyXG4gICAgXHJcbiAgICAncWFyaW4uaG9tZScsXHJcbiAgICAncWFyaW4ucHJvZHVjdHMnLFxyXG4gICAgJ3FhcmluLnRpY2tldHMnLFxyXG4gICAgJ3FhcmluLmNoYXQnXHJcbiAgICBdKVxyXG5cclxuXHJcbi5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAgIFxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld3M6IHtcclxuICAgICAgICAgICAgICAgICcnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb250cm9sbGVyOiAnUm9vdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xheW91dC9sYXlvdXQuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICxcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmaWNhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb250cm9sbGVyOiAnTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9ucy5odG1sJ1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2xheW91dCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzx1aS12aWV3PjwvdWktdmlldz4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICA7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxuXHJcbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3Ipe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCd1bmFibGUgdG8gdHJhbnNpdGlvbiB0byBzdGF0ZSAnICsgdG9TdGF0ZS5uYW1lKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd0aWNrZXQtaW5mbycsIHtcclxuXHRcdHVybDogJy90aWNrZXRzLzp0aWNrZXRJZCcsXHJcblx0XHRjb250cm9sbGVyOiAnVGlja2V0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90aWNrZXRzL3RpY2tldC1kZXRhaWxzLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHR0aWNrZXQ6IGZ1bmN0aW9uKHRpY2tldFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0dmFyIGlkID0gJHN0YXRlUGFyYW1zLnRpY2tldElkO1xyXG5cdFx0XHRcdHJldHVybiB0aWNrZXRTZXJ2aWNlLmdldChpZCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cdC5zdGF0ZSgndGlja2V0LWNyZWF0ZWQnLCB7XHJcblx0XHR1cmw6ICcvdGlja2V0cy86dGlja2V0SWQvY3JlYXRlZCcsXHJcblx0XHRjb250cm9sbGVyOiAnVGlja2V0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy90aWNrZXRzL3RpY2tldC1jcmVhdGVkLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHR0aWNrZXQ6IGZ1bmN0aW9uKHRpY2tldFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0dmFyIGlkID0gJHN0YXRlUGFyYW1zLnRpY2tldElkO1xyXG5cdFx0XHRcdHJldHVybiB0aWNrZXRTZXJ2aWNlLmdldChpZCk7XHJcblx0XHRcdH1cclxuXHRcdH1cdFxyXG5cdH0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ1RpY2tldENvbnRyb2xsZXInLCBUaWNrZXRDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIFRpY2tldENvbnRyb2xsZXIodGlja2V0LCB0aWNrZXRTZXJ2aWNlLCAkc3RhdGUsIHNvY2tldCkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHR0aWNrZXQ6IHRpY2tldCxcclxuXHRcdGNoYXQ6IGdvdG9DaGF0XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIGdvdG9DaGF0KCl7XHJcblx0XHRyZXR1cm4gJHN0YXRlLmdvKCdjaGF0Jywge2NoYXRJZDogdGlja2V0LmNoYXR9KTtcclxuXHR9XHJcblxyXG5cdHNvY2tldC5vbigndGFzazphc3NpZ25lZCcsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0Y29uc29sZS5sb2coJ3Rhc2s6YXNzaWduZWQnLCBkYXRhKTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5jaGF0JyxbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsICRzdGF0ZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGNoYXRTZXJ2aWNlLmdldE15Q2hhdHMoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY2hhdHMpe1xyXG5cdFx0XHR2bS5jaGF0cyA9IGNoYXRzO1xyXG5cdFx0fSlcclxuXHJcblx0XHQvLyBodHRwQ2xpZW50LmdldCgnL3VzZXJzL21lL2NoYXRzJywgb3B0cylcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHQvLyBcdFx0dm0uY2hhdHMgPSBwYXJzZShyZXMuZGF0YSk7XHJcblx0XHQvLyBcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZU5ld0NoYXQoKXtcclxuXHJcblx0XHRjaGF0U2VydmljZS5jcmVhdGUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY2hhdCl7XHJcblx0XHRcdCRzdGF0ZS5nbygnY2hhdCcsIHtjaGF0SWQ6IGNoYXQuX2lkfSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBodHRwQ2xpZW50LnBvc3QoJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9jaGF0JylcclxuXHRcdC8vIC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblx0XHQvLyBcdCRzdGF0ZS5nbygnY2hhdCcsIHtpZDogcmVzLmRhdGEuX2lkfSk7XHJcblx0XHQvLyB9KTtcclxuXHR9XHJcbn1cclxuIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmNoYXQnKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGNyZWF0ZTogX2NyZWF0ZUNoYXQsXHJcblx0XHRnZXRCeUlkOiBnZXRDaGF0QnlJZCxcclxuXHRcdGdldE15Q2hhdHM6IGdldE15Q2hhdHNcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge1xyXG5cdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2VcclxuXHRcdFx0fSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9jcmVhdGVDaGF0KG9wdHMpIHtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcsIG9wdHMpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDaGF0QnlJZChpZCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiBuZXcgQ2hhdChyZXMuZGF0YSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpIHtcclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ2NoYXQtbWVzc2FnZScsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRNeUNoYXRzKCkge1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcGFyc2UocmVzLmRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlKGRhdGEpIHtcclxuXHJcblx0XHRyZXR1cm4gZGF0YS5tYXAoZnVuY3Rpb24oeCkge1xyXG5cdFx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHRcdC8vIGNvcHkgcmF3IHByb3BlcnRpZXNcclxuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIGRhdGEpO1xyXG5cclxuXHRcdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHRcdHZhciBvdGhlcnMgPSBbXTtcclxuXHJcblx0XHRkYXRhLnBhcnRpY2lwYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcclxuXHRcdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHJcblx0XHRcdG90aGVycy5wdXNoKHguZmlyc3ROYW1lKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMudXNlcnMgPSBvdGhlcnMuam9pbignLCAnKTtcclxuXHJcblx0XHR0aGlzLmxhc3RNZXNzYWdlID0gZGF0YS5tZXNzYWdlcy5zbGljZSgtMSlbMF07XHJcblxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5jaGF0JylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG5cdFx0XHR1cmw6ICcvY2hhdCcsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG5cdFx0XHRjb250cm9sbGVyQXM6ICd2bSdcclxuXHRcdH0pXHJcblx0XHQuc3RhdGUoJ2NoYXQnLCB7XHJcblx0XHRcdHVybDogJy9jaGF0LzpjaGF0SWQnLFxyXG5cdFx0XHRwYXJlbnQ6ICdsYXlvdXQnLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXQuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdDaGF0Q29udHJvbGxlcicsXHJcblx0XHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJHN0YXRlUGFyYW1zLmNoYXRJZDtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGNoYXQ6IGZ1bmN0aW9uKGNoYXRJZCwgY2hhdFNlcnZpY2UpIHtcclxuXHRcdFx0XHRcdHJldHVybiBjaGF0U2VydmljZS5nZXRCeUlkKGNoYXRJZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmNoYXQnKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0LCBodHRwQ2xpZW50LCAkcm9vdFNjb3BlLCBjaGF0U2VydmljZSkge1xyXG5cclxuXHRcdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdFx0Y2hhdDogY2hhdCxcclxuXHRcdFx0c2VuZDogc2VuZE1lc3NhZ2UsXHJcblx0XHRcdG1lc3NhZ2U6ICcnLFxyXG5cdFx0XHRwcm9kdWN0OiBudWxsXHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGNoYXRJZClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHQvLyBcdFx0dm0uY2hhdCA9IHJlcy5kYXRhO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHJcblx0XHQkcm9vdFNjb3BlLiRvbignY2hhdC1tZXNzYWdlJywgZnVuY3Rpb24oZSwgbXNnKSB7XHJcblx0XHRcdHZtLmNoYXQubWVzc2FnZXMucHVzaChtc2cpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKSB7XHJcblx0XHRcdHZhciBtZXNzYWdlID0gdm0ubWVzc2FnZTtcclxuXHRcdFx0dm0ubWVzc2FnZSA9ICcnO1xyXG5cclxuXHRcdFx0Y2hhdFNlcnZpY2Uuc2VuZE1lc3NhZ2UoY2hhdC5faWQsIG1lc3NhZ2UpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdPdXRzaWRlU2hlbGxDb250cm9sbGVyJywgT3V0c2lkZVNoZWxsQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBPdXRzaWRlU2hlbGxDb250cm9sbGVyKHN0b3JlU2VydmljZSwgc3RvcmFnZVNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuXHR2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcclxuXHR3aW5kb3cuYWRkU3R5bGVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcclxuXHRcdG5vZGUuaW5uZXJIVE1MID0gc3RyO1xyXG5cdH07XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHNldFN0b3JlOiBfc2V0U3RvcmUsXHJcblx0XHRzZXRTdG9yZVVzaW5nTG9jYXRpb246IF9zZXRTdG9yZVVzaW5nTG9jYXRpb24sXHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRTdG9yZShpZCkge1x0XHRcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0QnlJZChpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmUpIHtcclxuXHRcdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudCA9IHN0b3JlO1xyXG5cdFx0XHRcdHN0b3JhZ2VTZXJ2aWNlLnNldCgnc3RvcmUnLCBpZCwgdHJ1ZSk7XHJcblxyXG5cdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gc3RvcmU7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX3NldFN0b3JlVXNpbmdMb2NhdGlvbigpIHtcclxuXHRcdFxyXG5cdFx0c3RvcmFnZVNlcnZpY2UucmVtb3ZlKCdzdG9yZScpO1xyXG5cdFx0cmV0dXJuIHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZSkge1xyXG5cclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHN0b3JlO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnLCBbJ3VpLnJvdXRlciddKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignU2VhcmNoQ29udHJvbGxlcicsIFNlYXJjaENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFNlYXJjaENvbnRyb2xsZXIoaHR0cENsaWVudCwgc3RvcmVTZXJ2aWNlLCBxdWVyeSwgJHN0YXRlLCAkbG9jYXRpb24pe1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRwcm9kdWN0czogW10sXHJcblx0XHRxdWVyeTogcXVlcnkgfHwgJycsXHJcblx0XHRzZWFyY2g6IF9zZWFyY2hcclxuXHR9KTtcclxuXHJcblx0X2luaXQoKTtcclxuXHJcblx0ZnVuY3Rpb24gX2luaXQoKXtcclxuXHRcdCBpZighdm0ucXVlcnkpXHJcblx0XHQgXHRyZXR1cm47XHJcblx0XHQvLyBcdF9zZWFyY2goKTtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9wcm9kdWN0cz9zZWFyY2g9JyArIHZtLnF1ZXJ5O1xyXG5cdFx0aHR0cENsaWVudC5nZXQodXJsKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0dm0ucHJvZHVjdHMgPSByZXMuZGF0YTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX3NlYXJjaCgpe1xyXG5cclxuXHRcdC8vIHZhciBvcmlnaW5hbFVybCA9ICRsb2NhdGlvbi51cmwoKTtcclxuXHRcdC8vIHZhciB1cmwgPSAkc3RhdGUuaHJlZignc2VhcmNoJywge3F1ZXJ5OiB2bS5xdWVyeX0pO1xyXG5cdFx0Ly8gaWYob3JpZ2luYWxVcmwgIT09IHVybClcclxuXHRcdC8vIFx0JGxvY2F0aW9uLnVybCh1cmwpO1xyXG5cdFx0Ly8kbG9jYXRpb24ucHVzaFxyXG5cdFx0JHN0YXRlLmdvKCdzZWFyY2gnLCB7cXVlcnk6IHZtLnF1ZXJ5fSwge3JlbG9hZDogdHJ1ZX0pO1xyXG5cdFx0XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuXHQuY29uZmlnKHJlZ2lzdGVyUm91dGVzKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiByZWdpc3RlclJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcclxuXHRcdHVybDogJy9zZWFyY2g/cXVlcnknLFxyXG5cdFx0Y29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvc2VhcmNoLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRxdWVyeTogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuXHRcdFx0XHRyZXR1cm4gJHN0YXRlUGFyYW1zLnF1ZXJ5O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSlcclxuXHQuc3RhdGUoJ3Byb2R1Y3QnLCB7XHJcblx0XHR1cmw6ICcvcHJvZHVjdC86cHJvZHVjdElkJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9wcm9kdWN0cy9wcm9kdWN0Lmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRwcm9kdWN0OiBmdW5jdGlvbihwcm9kdWN0U2VydmljZSwgJHN0YXRlUGFyYW1zKXtcclxuXHRcdFx0XHRyZXR1cm4gcHJvZHVjdFNlcnZpY2UuZ2V0KCRzdGF0ZVBhcmFtcy5wcm9kdWN0SWQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5mYWN0b3J5KCdwcm9kdWN0U2VydmljZScsIFByb2R1Y3RTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFByb2R1Y3RTZXJ2aWNlKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldDogX2dldFByb2R1Y3RCeUlkXHJcblx0fTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRQcm9kdWN0QnlJZChpZCkge1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL3Byb2R1Y3RzLycgKyBpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBQcm9kdWN0Q29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gUHJvZHVjdENvbnRyb2xsZXIocHJvZHVjdFNlcnZpY2UsIHByb2R1Y3QsICRzdGF0ZSwgY2hhdFNlcnZpY2Upe1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRwcm9kdWN0OiBwcm9kdWN0LFxyXG5cdFx0Y3JlYXRlQ2hhdDogX2NyZWF0ZUNoYXRcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZUNoYXQoKXtcclxuXHJcblx0XHRjaGF0U2VydmljZS5jcmVhdGUoe3Byb2R1Y3Q6IHByb2R1Y3QuX2lkfSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGNoYXQpe1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IGNoYXQuX2lkfSk7XHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGV4KTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQub24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuICAgIH0pO1xyXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIHN0b3JlU2VydmljZSwgZXJyb3JTZXJ2aWNlKSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdC8vIGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdC8vIFx0cmV0dXJuO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cdFx0aWYoc3RvcmUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0JHN0YXRlLmdvKHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuXHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xyXG5cdFx0XHRlcnJvclNlcnZpY2UubGFzdEVycm9yID0gZXJyO1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2Vycm9yJyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdC8vIFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHQvLyBcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHQvLyBcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIHNvY2tldCwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuXHRcdG5vdGlmaWNhdGlvbnM6IFtdXHJcblx0fSk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuXHRcdHZhciBub3RpZmljYXRpb24gPSB7XHJcblx0XHRcdG5hbWU6ICdtZXNzYWdlJyxcclxuXHRcdFx0ZGF0YTogZGF0YSxcclxuXHRcdFx0Z286IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdjaGF0KHtpZDogZGF0YS5jaGF0fSknKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHRcdHZtLm5vdGlmaWNhdGlvbnMudW5zaGlmdChub3RpZmljYXRpb24pO1xyXG5cclxuXHR9KTtcclxuXHJcblx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKSB7XHJcblx0XHR2bS5zdG9yZSA9IGFyZ3Muc3RvcmU7XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJywgW10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbmZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Vycm9yJywge1xyXG5cdFx0dXJsOiAnL2Vycm9yJyxcclxuXHRcdHBhcmVudDogJ3Jvb3QnLFxyXG5cdFx0Y29udHJvbGxlcjogJ0Vycm9yc0NvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvZXJyb3JzL2Vycm9yLmh0bWwnXHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29udHJvbGxlcignRXJyb3JDb250cm9sbGVyJywgRXJyb3JDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBFcnJvckNvbnRyb2xsZXIoZXJyb3JTZXJ2aWNlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGVycm9yOiBlcnJvclNlcnZpY2UubGFzdEVycm9yXHJcblx0fSk7XHJcblxyXG4kcm9vdFNjb3BlLnNob3dTcGxhc2ggPSBmYWxzZTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuLmZhY3RvcnkoJ2Vycm9yU2VydmljZScsIEVycm9yU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JTZXJ2aWNlKCl7XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0bGFzdEVycm9yOiBudWxsXHJcblx0fTtcclxuXHRyZXR1cm4gc2VydmljZTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UsIHRpY2tldFNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuICAgIHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuICAgICAgICBzdG9yZTogc3RvcmVTZXJ2aWNlLmN1cnJlbnQsXHJcbiAgICAgICAgcmVxdWVzdEhlbHA6IF9yZXF1ZXN0SGVscCAgICAgICAgXHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBfcmVxdWVzdEhlbHAoKSB7IFxyXG4gICAgICAgIC8vcmV0dXJuIHN0b3JlU2VydmljZS5yZXF1ZXN0SGVscCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGlja2V0U2VydmljZS5jcmVhdGUoKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHRpY2tldCl7XHJcbiAgICAgICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ3RpY2tldC1jcmVhdGVkJywge3RpY2tldElkOiB0aWNrZXQuX2lkfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKXtcclxuICAgICAgICB2bS5zdG9yZSA9IGFyZ3Muc3RvcmU7XHJcbiAgICB9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5zZXJ2aWNlKCd1dGlsJywgVXRpbFNlcnZpY2UpO1xyXG5cclxuZnVuY3Rpb24gVXRpbFNlcnZpY2UoKXtcclxuXHJcblx0dGhpcy5qb2luID0gZnVuY3Rpb24oKXtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdFx0cmV0dXJuICcvJyArIGFyZ3Muam9pbignLycpO1xyXG5cdH07XHJcblx0XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoZ2VvTG9jYXRpb24sIGh0dHBDbGllbnQsICRyb290U2NvcGUsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciBfY3VycmVudCA9IG51bGw7XHJcblx0dmFyIGF2YWlsYWJsZUV2ZW50cyA9IFsnc3RvcmVDaGFuZ2VkJ107XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0Z2V0QnlJZDogX2dldEJ5SWQsXHJcblx0XHRnZXRDdXJyZW50U3RvcmU6IF9nZXRDdXJyZW50U3RvcmUsXHJcblx0XHRvbjogX3JlZ2lzdGVyTGlzdGVuZXIsXHJcblx0XHRyZXF1ZXN0SGVscDogcmVxdWVzdEhlbHBcclxuXHR9O1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnQnLCB7XHJcblx0XHRnZXQ6IF9nZXRfY3VycmVudCxcclxuXHRcdHNldDogX3NldF9jdXJyZW50LFxyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZVxyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gcmVxdWVzdEhlbHAoKSB7XHJcblx0XHR2YXIgcmVxdWVzdCA9IHtcclxuXHRcdFx0dHlwZTogJ3JlcXVlc3QnLFxyXG5cdFx0XHQvL2N1c3RvbWVyOiBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpLFxyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9zdG9yZXMvJyArIF9jdXJyZW50LmlkICsgJy90YXNrcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwgcmVxdWVzdClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRfY3VycmVudCgpIHtcclxuXHRcdHJldHVybiBfY3VycmVudDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRfY3VycmVudCh2YWx1ZSkge1xyXG5cdFx0X2N1cnJlbnQgPSB2YWx1ZTtcclxuXHRcdCRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtcclxuXHRcdFx0c3RvcmU6IF9jdXJyZW50XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRCeUlkKGlkKSB7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldEN1cnJlbnRTdG9yZSgpIHtcclxuXHJcblx0XHR2YXIgc3RvcmVkU3RvcmUgPSBzdG9yYWdlU2VydmljZS5nZXQoJ3N0b3JlJyk7XHJcblx0XHRpZiAoc3RvcmVkU3RvcmUpIHtcclxuXHJcblx0XHRcdHJldHVybiBfZ2V0QnlJZChzdG9yZWRTdG9yZSlcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZSkge1xyXG5cdFx0XHRcdFx0X2N1cnJlbnQgPSBzdG9yZTtcclxuXHRcdFx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtcclxuXHRcdFx0XHRcdFx0c3RvcmU6IF9jdXJyZW50XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2VvTG9jYXRpb24uZ2V0R3BzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oZ3BzKSB7XHJcblxyXG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7XHJcblx0XHRcdFx0XHRsYXQ6IGdwcy5jb29yZHMubGF0aXR1ZGUsXHJcblx0XHRcdFx0XHRsbmc6IGdwcy5jb29yZHMubG9uZ2l0dWRlXHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvbG9jYXRpb25zJywge1xyXG5cdFx0XHRcdFx0XHRwYXJhbXM6IHBhcmFtc1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+PSAxKSB7XHJcblx0XHRcdFx0XHRcdFx0X2N1cnJlbnQgPSByZXNwb25zZS5kYXRhWzBdO1xyXG5cclxuXHRcdFx0XHRcdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRzdG9yZTogX2N1cnJlbnRcclxuXHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gX2N1cnJlbnQ7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfcmVnaXN0ZXJMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKSB7XHJcblxyXG5cdFx0aWYgKGF2YWlsYWJsZUV2ZW50cy5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgZXZlbnQgXFwnJyArIG5hbWUgKyAnXFwnIGlzIG5vdCBhdmFpbGFibGUgb24gc3RvcmVTZXJ2aWNlLicpO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKG5hbWUsIGhhbmRsZXIpO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0QnVpbGRlcicsIGZ1bmN0aW9uIChzb2NrZXRGYWN0b3J5LCBlbnYsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgICAgICAgICBpZihuYW1lc3BhY2UpXHJcbiAgICAgICAgICAgICAgICB1cmkgKz0gbmFtZXNwYWNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRldmljZUlkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteUlvU29ja2V0ID0gaW8uY29ubmVjdCh1cmksIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5OiAnZGV2aWNlPScgKyBkZXZpY2VJZFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteVNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbXlTb2NrZXQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ25vdGlmaWNhdGlvblNlcnZpY2UnLCBOb3RpZmljYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBOb3RpZmljYXRpb25TZXJ2aWNlKCRyb290U2NvcGUsIHNvY2tldEJ1aWxkZXIpe1xyXG5cclxuXHR2YXIgc29ja2V0ID0gc29ja2V0QnVpbGRlcignJyk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdC8vXHQkcm9vdFNjb3BlXHJcblx0fSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ2dlb0xvY2F0aW9uJywgR2VvTG9jYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBHZW9Mb2NhdGlvblNlcnZpY2UoJHEsICR3aW5kb3csICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgd2F0Y2hlckNvdW50ID0gMDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldEdwczogX2N1cnJlbnRQb3NpdGlvbixcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4LmNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBkZWZlci5yZWplY3QoJ1Blcm1pc3Npb24gRGVuaWVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQb3NpdGlvbiBVbmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGRlZmVyLnJlamVjdCgnVGltZW91dCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWZlci5yZWplY3QoJ1Vua293bicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4uaW50ZXJjZXB0b3JzJywgW10pXHJcblx0LmZhY3RvcnkoJ2RldmljZUludGVyY2VwdG9yJywgRGV2aWNlSW50ZXJjZXB0b3IpXHJcbiAgICAuY29uZmlnKGFkZEludGVyY2VwdG9ycyk7XHJcblxyXG5mdW5jdGlvbiBEZXZpY2VJbnRlcmNlcHRvcigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG5cdHJldHVybiB7XHJcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCFjb25maWcgfHwgIWNvbmZpZy5oZWFkZXJzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWyd4LWRldmljZSddID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRJbnRlcmNlcHRvcnMoJGh0dHBQcm92aWRlcil7XHJcblx0JGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZGV2aWNlSW50ZXJjZXB0b3InKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5kaXJlY3RpdmUoJ3FhU2V0U3RvcmVDbGFzcycsIHNldFN0b3JlQ2xhc3MpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIHNldFN0b3JlQ2xhc3Moc3RvcmVTZXJ2aWNlKXtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpbms6IF9saW5rRm5cclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBfbGlua0ZuKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcblxyXG5cdFx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKXtcclxuXHRcdFx0Ly9hdHRycy5pZCA9IGFyZ3Muc3RvcmUub3JnYW5pemF0aW9uLmFsaWFzO1xyXG5cdFx0XHRlbGVtZW50LmF0dHIoXCJpZFwiLCBhcmdzLnN0b3JlLm9yZ2FuaXphdGlvbi5hbGlhcyk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29uZmlnKF9jb25maWd1cmVIdHRwKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBfY29uZmlndXJlSHR0cChodHRwQ2xpZW50UHJvdmlkZXIsIGVudikge1xyXG4gICAgaHR0cENsaWVudFByb3ZpZGVyLmJhc2VVcmkgPSBlbnYuYXBpUm9vdDtcclxuICAgIC8vaHR0cENsaWVudFByb3ZpZGVyLmF1dGhUb2tlbk5hbWUgPSBcInRva2VuXCI7XHJcbiAgICAvL2h0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5UeXBlID0gXCJCZWFyZXJcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxuICAgIC8vYXBpUm9vdDogJ2h0dHA6Ly8xOTIuMTY4LjEuMTIyOjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==