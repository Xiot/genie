(function () {
    'use strict';
    angular.module('qarin.products', ['ui.router']);
}());
(function () {
    'use strict';
    angular.module('qarin.products').controller('SearchController', SearchController);
    // @ngInject
    function SearchController(httpClient, storeService) {
        var vm = angular.extend(this, {
            products: [],
            query: '',
            search: _search
        });
        function _search() {
            var url = '/stores/' + storeService.current.id + '/products?search=' + vm.query;
            httpClient.get(url).then(function (res) {
                vm.products = res.data;
            });
        }
        function _init() {
            var opts = { params: { store: storeService.current.id } };
            httpClient.get('/users/me/chats', opts).then(function (res) {
                vm.chats = parse(res.data);
            });
        }
    }
    SearchController.$inject = ["httpClient", "storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin.products').config(registerRoutes);
    // @ngInject
    function registerRoutes($stateProvider) {
        $stateProvider.state('search', {
            url: '/search',
            controller: 'SearchController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/products/search.html'
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
    angular.module('qarin', [
        'symbiote.common',
        'qarin.partials',
        'ui.router',
        'ngAnimate',
        'btford.socket-io',
        'qarin.interceptors',
        'qarin.errors',
        'qarin.home',
        'qarin.products'
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
        }).state('chat-list', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chatlist.html',
            controller: 'ChatListController',
            controllerAs: 'vm'
        }).state('chat', {
            url: '/chat/:id',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chat.html',
            controller: 'ChatController',
            controllerAs: 'vm',
            resolve: {
                chatId: ["$stateParams", function ($stateParams) {
                    return $stateParams.id;
                }]
            }
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
    }]);
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
    function HomeController($scope, $http, env, socket, storeService) {
        var vm = angular.extend(this, {
            store: storeService.current,
            requestHelp: _requestHelp
        });
        function _requestHelp() {
            socket.emit('help-requested', { store_id: storeService.current._id });
        }
        ;
        storeService.on('storeChanged', function (e, args) {
            vm.store = args.store;
        });
    }
    HomeController.$inject = ["$scope", "$http", "env", "socket", "storeService"];
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
    angular.module('qarin').controller('ChatListController', ChatListController);
    // @ngInject
    function ChatListController(httpClient, storeService, $state, chatService) {
        var vm = angular.extend(this, {
            chats: null,
            create: _createNewChat
        });
        _init();
        function _init() {
            var opts = { params: { store: storeService.current.id } };
            httpClient.get('/users/me/chats', opts).then(function (res) {
                vm.chats = parse(res.data);
            });
        }
        function _createNewChat() {
            chatService.create().then(function (chat) {
                $state.go('chat', { id: chat._id });
            });    // httpClient.post('/stores/' + storeService.current.id + '/chat')
                   // .then(function(res){
                   // 	$state.go('chat', {id: res.data._id});
                   // });
        }
    }
    ChatListController.$inject = ["httpClient", "storeService", "$state", "chatService"];
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
}());
(function () {
    'use strict';
    angular.module('qarin').factory('chatService', ChatFactory);
    /* @ngInject */
    function ChatFactory($rootScope, httpClient, socket, storeService) {
        var service = {
            sendMessage: sendMessage,
            create: _createChat
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
        function init() {
            socket.on('message', function (data) {
                console.log(data);
                $rootScope.$emit('chat-message', data);
            });
        }
    }
    ChatFactory.$inject = ["$rootScope", "httpClient", "socket", "storeService"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('ChatController', ["socket", "storeService", "chatId", "httpClient", "$rootScope", "chatService", function (socket, storeService, chatId, httpClient, $rootScope, chatService) {
        var vm = angular.extend(this, {
            chat: null,
            send: sendMessage,
            message: '',
            product: null
        });
        httpClient.get('/chat/' + chatId).then(function (res) {
            vm.chat = res.data;
        });
        $rootScope.$on('chat-message', function (e, msg) {
            vm.chat.messages.push(msg);
        });
        function sendMessage() {
            var message = vm.message;
            vm.message = '';
            chatService.sendMessage(chatId, message).then(function (msg) {
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
    angular.module('qarin').factory('storeService', StoreService);
    /* @ngInject */
    function StoreService(geoLocation, httpClient, $rootScope) {
        var _current = null;
        var availableEvents = ['storeChanged'];
        var service = {
            getCurrentStore: _getCurrentStore,
            on: _registerListener
        };
        Object.defineProperty(service, 'current', {
            get: function () {
                return _current;
            },
            enumerable: true
        });
        return service;
        function _getCurrentStore() {
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
    StoreService.$inject = ["geoLocation", "httpClient", "$rootScope"];
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
    angular.module('qarin').constant('env', { apiRoot: 'http://localhost:3000' });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLm1vZHVsZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3NlYXJjaC5jb250cm9sbGVyLmpzIiwiYXJlYXMvcHJvZHVjdHMvcHJvZHVjdHMucm91dGVzLmpzIiwiYXJlYXMvcHJvZHVjdHMvcHJvZHVjdC5zZXJ2aWNlLmpzIiwiYXJlYXMvcHJvZHVjdHMvcHJvZHVjdC5jb250cm9sbGVyLmpzIiwiYXBwLmpzIiwiYXJlYXMvbm90aWZpY2F0aW9ucy9Ob3RpZmljYXRpb25zQ29udHJvbGxlci5qcyIsImFyZWFzL2xheW91dC9sb2NhdG9yLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbGF5b3V0LmNvbmZpZy5qcyIsImFyZWFzL2xheW91dC9oZWFkZXIuY29udHJvbGxlci5qcyIsImFyZWFzL2hvbWUvaG9tZS5tb2R1bGUuanMiLCJhcmVhcy9ob21lL2hvbWUucm91dGVzLmpzIiwiYXJlYXMvaG9tZS9Ib21lQ29udHJvbGxlci5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMubW9kdWxlLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5yb3V0ZXMuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3Iuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvY2hhdGxpc3QuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9DaGF0Q29udHJvbGxlci5qcyIsInNlcnZpY2VzL3N0b3JlU2VydmljZS5qcyIsInNlcnZpY2VzL3NvY2tldHMuanMiLCJzZXJ2aWNlcy9ub3RpZmljYXRpb24uc2VydmljZS5qcyIsInNlcnZpY2VzL2dlb0xvY2F0aW9uU2VydmljZS5qcyIsInNlcnZpY2VzL2RldmljZUludGVyY2VwdG9yLmpzIiwiY29uZmlnL2h0dHAuanMiLCJjb25maWcvZW52aXJvbm1lbnQuanMiXSwibmFtZXMiOlsiYW5ndWxhciIsIm1vZHVsZSIsImNvbnRyb2xsZXIiLCJTZWFyY2hDb250cm9sbGVyIiwiaHR0cENsaWVudCIsInN0b3JlU2VydmljZSIsInZtIiwiZXh0ZW5kIiwicHJvZHVjdHMiLCJxdWVyeSIsInNlYXJjaCIsIl9zZWFyY2giLCJ1cmwiLCJjdXJyZW50IiwiaWQiLCJnZXQiLCJ0aGVuIiwicmVzIiwiZGF0YSIsIl9pbml0Iiwib3B0cyIsInBhcmFtcyIsInN0b3JlIiwiY2hhdHMiLCJwYXJzZSIsImNvbmZpZyIsInJlZ2lzdGVyUm91dGVzIiwiJHN0YXRlUHJvdmlkZXIiLCJzdGF0ZSIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwicmVzb2x2ZSIsInByb2R1Y3QiLCJwcm9kdWN0U2VydmljZSIsIiRzdGF0ZVBhcmFtcyIsInByb2R1Y3RJZCIsImZhY3RvcnkiLCJQcm9kdWN0U2VydmljZSIsInNlcnZpY2UiLCJfZ2V0UHJvZHVjdEJ5SWQiLCJQcm9kdWN0Q29udHJvbGxlciIsIiRzdGF0ZSIsImNoYXRTZXJ2aWNlIiwiY3JlYXRlQ2hhdCIsIl9jcmVhdGVDaGF0IiwiY3JlYXRlIiwiX2lkIiwiY2hhdCIsImdvIiwiY2F0Y2giLCJleCIsImNvbnNvbGUiLCJsb2ciLCIkaHR0cFByb3ZpZGVyIiwiJHVybFJvdXRlclByb3ZpZGVyIiwib3RoZXJ3aXNlIiwiYWJzdHJhY3QiLCJ2aWV3cyIsInBhcmVudCIsInRlbXBsYXRlIiwiY2hhdElkIiwicnVuIiwiJHJvb3RTY29wZSIsIiRvbiIsImV2ZW50IiwidW5mb3VuZFN0YXRlIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsInRvIiwidG9QYXJhbXMiLCJvcHRpb25zIiwiJHNjb3BlIiwic29ja2V0Iiwib24iLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJlIiwidG9TdGF0ZSIsInByZXZlbnREZWZhdWx0IiwiZ2V0Q3VycmVudFN0b3JlIiwicmV0IiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsIm5hbWUiLCJ1bnNoaWZ0IiwiYXJncyIsImNvbmZpZ3VyZVJvdXRlcyIsIkhvbWVDb250cm9sbGVyIiwiJGh0dHAiLCJlbnYiLCJyZXF1ZXN0SGVscCIsIl9yZXF1ZXN0SGVscCIsImVtaXQiLCJzdG9yZV9pZCIsIkVycm9yQ29udHJvbGxlciIsImVycm9yIiwiRXJyb3JTZXJ2aWNlIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiX2NyZWF0ZU5ld0NoYXQiLCJtYXAiLCJ4IiwiQ2hhdCIsIm15RGV2aWNlSWQiLCJvdGhlcnMiLCJwYXJ0aWNpcGFudHMiLCJmb3JFYWNoIiwiZGV2aWNlIiwicHVzaCIsImZpcnN0TmFtZSIsInVzZXJzIiwiam9pbiIsImxhc3RNZXNzYWdlIiwibWVzc2FnZXMiLCJzbGljZSIsIkNoYXRGYWN0b3J5Iiwic2VuZE1lc3NhZ2UiLCJpbml0IiwibWVzc2FnZSIsInBvc3QiLCIkZW1pdCIsInNlbmQiLCJtc2ciLCJ0aW1lIiwidXNlciIsInNlbnQiLCJTdG9yZVNlcnZpY2UiLCJnZW9Mb2NhdGlvbiIsIl9jdXJyZW50IiwiYXZhaWxhYmxlRXZlbnRzIiwiX2dldEN1cnJlbnRTdG9yZSIsIl9yZWdpc3Rlckxpc3RlbmVyIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJlbnVtZXJhYmxlIiwiZ2V0R3BzIiwiZ3BzIiwibGF0IiwiY29vcmRzIiwibGF0aXR1ZGUiLCJsbmciLCJsb25naXR1ZGUiLCJyZXNwb25zZSIsImxlbmd0aCIsImhhbmRsZXIiLCJpbmRleE9mIiwiRXJyb3IiLCJzb2NrZXRGYWN0b3J5Iiwic3RvcmFnZVNlcnZpY2UiLCJidWlsZGVyIiwibmFtZXNwYWNlIiwidXJpIiwiYXBpUm9vdCIsImRldmljZUlkIiwibXlJb1NvY2tldCIsImlvIiwiY29ubmVjdCIsIm15U29ja2V0IiwiaW9Tb2NrZXQiLCJzb2NrZXRCdWlsZGVyIiwiTm90aWZpY2F0aW9uU2VydmljZSIsIkdlb0xvY2F0aW9uU2VydmljZSIsIiRxIiwiJHdpbmRvdyIsIndhdGNoZXJDb3VudCIsIl9jdXJyZW50UG9zaXRpb24iLCJuYXZpZ2F0b3IiLCJnZW9sb2NhdGlvbiIsInJlamVjdCIsImRlZmVyIiwiZ2V0Q3VycmVudFBvc2l0aW9uIiwicG9zIiwiJGFwcGx5IiwiY29kZSIsInByb21pc2UiLCJEZXZpY2VJbnRlcmNlcHRvciIsImFkZEludGVyY2VwdG9ycyIsInJlcXVlc3QiLCJoZWFkZXJzIiwiaW50ZXJjZXB0b3JzIiwiX2NvbmZpZ3VyZUh0dHAiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCJiYXNlVXJpIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBREpBLFFBQVFDLE9BQU8sa0JBQWtCLENBQUM7S0FHN0I7QUNITCxDQUFDLFlBQVk7SUFDVDtJQURKRCxRQUFRQyxPQUFPLGtCQUNkQyxXQUFXLG9CQUFvQkM7O0lBR2hDLFNBQVNBLGlCQUFpQkMsWUFBWUMsY0FBYTtRQUVsRCxJQUFJQyxLQUFLTixRQUFRTyxPQUFPLE1BQU07WUFDN0JDLFVBQVU7WUFDVkMsT0FBTztZQUNQQyxRQUFRQzs7UUFJVCxTQUFTQSxVQUFTO1lBRWpCLElBQUlDLE1BQU0sYUFBYVAsYUFBYVEsUUFBUUMsS0FBSyxzQkFBc0JSLEdBQUdHO1lBQzFFTCxXQUFXVyxJQUFJSCxLQUNkSSxLQUFLLFVBQVNDLEtBQUk7Z0JBQ2xCWCxHQUFHRSxXQUFXUyxJQUFJQzs7O1FBSXBCLFNBQVNDLFFBQVE7WUFDaEIsSUFBSUMsT0FBTyxFQUNWQyxRQUFRLEVBQ1BDLE9BQU9qQixhQUFhUSxRQUFRQztZQUk5QlYsV0FBV1csSUFBSSxtQkFBbUJLLE1BQ2hDSixLQUFLLFVBQVNDLEtBQUs7Z0JBQ25CWCxHQUFHaUIsUUFBUUMsTUFBTVAsSUFBSUM7Ozs7O0tBUnBCO0FDdkJMLENBQUMsWUFBWTtJQUNUO0lBREpsQixRQUFRQyxPQUFPLGtCQUNid0IsT0FB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SUFDVDtJQURKbEgsUUFBUUMsT0FBTyxTQUNkd0IsT0FBT2lLOztJQUdSLFNBQVNBLGVBQWVDLG9CQUFvQjNGLEtBQUs7UUFDN0MyRixtQkFBbUJDLFVBQVU1RixJQUFJOEQ7Ozs7S0FHaEM7QUNSTCxDQUFDLFlBQVk7SUFDVDtJQURKOUosUUFBUUMsT0FBTyxTQUNkNEwsU0FBUyxPQUFPLEVBQ2IvQixTQUFTO0tBQ1IiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBTZWFyY2hDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBTZWFyY2hDb250cm9sbGVyKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSl7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHByb2R1Y3RzOiBbXSxcclxuXHRcdHF1ZXJ5OiAnJyxcclxuXHRcdHNlYXJjaDogX3NlYXJjaFxyXG5cdH0pO1xyXG5cclxuXHJcblx0ZnVuY3Rpb24gX3NlYXJjaCgpe1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL3Byb2R1Y3RzP3NlYXJjaD0nICsgdm0ucXVlcnk7XHJcblx0XHRodHRwQ2xpZW50LmdldCh1cmwpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHR2bS5wcm9kdWN0cyA9IHJlcy5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfaW5pdCgpIHtcclxuXHRcdHZhciBvcHRzID0ge1xyXG5cdFx0XHRwYXJhbXM6IHtcclxuXHRcdFx0XHRzdG9yZTogc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWRcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3VzZXJzL21lL2NoYXRzJywgb3B0cylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uY2hhdHMgPSBwYXJzZShyZXMuZGF0YSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5jb25maWcocmVnaXN0ZXJSb3V0ZXMpXHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gcmVnaXN0ZXJSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XHJcblx0XHR1cmw6ICcvc2VhcmNoJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Byb2R1Y3RzL3NlYXJjaC5odG1sJ1xyXG5cdH0pXHJcblx0LnN0YXRlKCdwcm9kdWN0Jywge1xyXG5cdFx0dXJsOiAnL3Byb2R1Y3QvOnByb2R1Y3RJZCcsXHJcblx0XHRjb250cm9sbGVyOiAnUHJvZHVjdENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvcHJvZHVjdC5odG1sJyxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0cHJvZHVjdDogZnVuY3Rpb24ocHJvZHVjdFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0cmV0dXJuIHByb2R1Y3RTZXJ2aWNlLmdldCgkc3RhdGVQYXJhbXMucHJvZHVjdElkKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuXHQuZmFjdG9yeSgncHJvZHVjdFNlcnZpY2UnLCBQcm9kdWN0U2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBQcm9kdWN0U2VydmljZShodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRnZXQ6IF9nZXRQcm9kdWN0QnlJZFxyXG5cdH07XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBfZ2V0UHJvZHVjdEJ5SWQoaWQpIHtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9wcm9kdWN0cy8nICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgUHJvZHVjdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFByb2R1Y3RDb250cm9sbGVyKHByb2R1Y3RTZXJ2aWNlLCBwcm9kdWN0LCAkc3RhdGUsIGNoYXRTZXJ2aWNlKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdDogcHJvZHVjdCxcclxuXHRcdGNyZWF0ZUNoYXQ6IF9jcmVhdGVDaGF0XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9jcmVhdGVDaGF0KCl7XHJcblxyXG5cdFx0Y2hhdFNlcnZpY2UuY3JlYXRlKHtwcm9kdWN0OiBwcm9kdWN0Ll9pZH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhleCk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJywgWyAgICBcclxuICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgJ3FhcmluLnBhcnRpYWxzJyxcclxuICAgICd1aS5yb3V0ZXInLFxyXG4gICAgJ25nQW5pbWF0ZScsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbycsXHJcblxyXG4gICAgJ3FhcmluLmludGVyY2VwdG9ycycsXHJcbiAgICAncWFyaW4uZXJyb3JzJyxcclxuICAgIFxyXG4gICAgJ3FhcmluLmhvbWUnLFxyXG4gICAgJ3FhcmluLnByb2R1Y3RzJ1xyXG5cclxuICAgIF0pXHJcblxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICAgXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgICAuc3RhdGUoJ3Jvb3QnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB2aWV3czoge1xyXG4gICAgICAgICAgICAgICAgJyc6IHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdSb290Q29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbGF5b3V0L2xheW91dC5odG1sJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gLFxyXG4gICAgICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnRyb2xsZXI6ICdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnXHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbGF5b3V0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHVpLXZpZXc+PC91aS12aWV3PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvY2hhdCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQvOmlkJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlUGFyYW1zLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQub24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuICAgIH0pO1xyXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIHN0b3JlU2VydmljZSwgZXJyb3JTZXJ2aWNlKSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdC8vIGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdC8vIFx0cmV0dXJuO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cdFx0aWYoc3RvcmUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0JHN0YXRlLmdvKHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuXHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xyXG5cdFx0XHRlcnJvclNlcnZpY2UubGFzdEVycm9yID0gZXJyO1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2Vycm9yJyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdC8vIFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHQvLyBcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHQvLyBcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIHNvY2tldCwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuXHRcdG5vdGlmaWNhdGlvbnM6IFtdXHJcblx0fSk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuXHRcdHZhciBub3RpZmljYXRpb24gPSB7XHJcblx0XHRcdG5hbWU6ICdtZXNzYWdlJyxcclxuXHRcdFx0ZGF0YTogZGF0YSxcclxuXHRcdFx0Z286IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdjaGF0KHtpZDogZGF0YS5jaGF0fSknKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dm0ubm90aWZpY2F0aW9ucy51bnNoaWZ0KG5vdGlmaWNhdGlvbik7XHJcblxyXG5cdH0pO1xyXG5cclxuXHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3MpIHtcclxuXHRcdHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHBcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0SGVscCgpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnaGVscC1yZXF1ZXN0ZWQnLCB7c3RvcmVfaWQ6IHN0b3JlU2VydmljZS5jdXJyZW50Ll9pZH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG4gICAgICAgIHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuICAgIH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdlcnJvcicsIHtcclxuXHRcdHVybDogJy9lcnJvcicsXHJcblx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFcnJvcnNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Vycm9ycy9lcnJvci5odG1sJ1xyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbnRyb2xsZXIoJ0Vycm9yQ29udHJvbGxlcicsIEVycm9yQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JDb250cm9sbGVyKGVycm9yU2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlcnJvcjogZXJyb3JTZXJ2aWNlLmxhc3RFcnJvclxyXG5cdH0pO1xyXG5cclxuJHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcbi5mYWN0b3J5KCdlcnJvclNlcnZpY2UnLCBFcnJvclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yU2VydmljZSgpe1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGxhc3RFcnJvcjogbnVsbFxyXG5cdH07XHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsICRzdGF0ZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlTmV3Q2hhdCgpe1xyXG5cclxuXHRcdGNoYXRTZXJ2aWNlLmNyZWF0ZSgpXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcpXHJcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0Ly8gXHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IHJlcy5kYXRhLl9pZH0pO1xyXG5cdFx0Ly8gfSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcblxyXG5cdHJldHVybiBkYXRhLm1hcChmdW5jdGlvbih4KSB7XHJcblx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHQvLyBjb3B5IHJhdyBwcm9wZXJ0aWVzXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XHJcblxyXG5cdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHR2YXIgb3RoZXJzID0gW107XHJcblxyXG5cdGRhdGEucGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xyXG5cdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0b3RoZXJzLnB1c2goeC5maXJzdE5hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnVzZXJzID0gb3RoZXJzLmpvaW4oJywgJyk7XHJcblxyXG5cdHRoaXMubGFzdE1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2VzLnNsaWNlKC0xKVswXTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGNyZWF0ZTogX2NyZWF0ZUNoYXRcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge21lc3NhZ2U6IG1lc3NhZ2V9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlQ2hhdChvcHRzKXtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcsIG9wdHMpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhKTtcclxuXHRcdFx0JHJvb3RTY29wZS4kZW1pdCgnY2hhdC1tZXNzYWdlJywgZGF0YSk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0SWQsIGh0dHBDbGllbnQsICRyb290U2NvcGUsIGNoYXRTZXJ2aWNlKSB7XHJcblxyXG5cdFx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0XHRjaGF0OiBudWxsLFxyXG5cdFx0XHRzZW5kOiBzZW5kTWVzc2FnZSxcclxuXHRcdFx0bWVzc2FnZTogJycsXHJcblx0XHRcdHByb2R1Y3Q6IG51bGxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgY2hhdElkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0ID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpIHtcclxuXHRcdFx0dm0uY2hhdC5tZXNzYWdlcy5wdXNoKG1zZyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuXHRcdFx0dmFyIG1lc3NhZ2UgPSB2bS5tZXNzYWdlO1xyXG5cdFx0XHR2bS5tZXNzYWdlID0gJyc7XHJcblxyXG5cdFx0XHRjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0SWQsIG1lc3NhZ2UpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmZhY3RvcnkoJ3N0b3JlU2VydmljZScsIFN0b3JlU2VydmljZSk7XHJcblxyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFN0b3JlU2VydmljZShnZW9Mb2NhdGlvbiwgaHR0cENsaWVudCwgJHJvb3RTY29wZSkge1xyXG5cclxuICAgIHZhciBfY3VycmVudCA9IG51bGw7XHJcbiAgICB2YXIgYXZhaWxhYmxlRXZlbnRzID0gWydzdG9yZUNoYW5nZWQnXTtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHsgICAgICAgIFxyXG4gICAgICAgIGdldEN1cnJlbnRTdG9yZTogX2dldEN1cnJlbnRTdG9yZSxcclxuICAgICAgICBvbjogX3JlZ2lzdGVyTGlzdGVuZXJcclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50Jywge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gX2N1cnJlbnQ7IH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcbiAgICBmdW5jdGlvbiBfZ2V0Q3VycmVudFN0b3JlKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gZ2VvTG9jYXRpb24uZ2V0R3BzKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGdwcykge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF0OiBncHMuY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxuZzogZ3BzLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvbG9jYXRpb25zJywgeyBwYXJhbXM6IHBhcmFtcyB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPj0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2N1cnJlbnQgPSByZXNwb25zZS5kYXRhWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtzdG9yZTogX2N1cnJlbnR9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2N1cnJlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZWdpc3Rlckxpc3RlbmVyKG5hbWUsIGhhbmRsZXIpe1xyXG5cclxuICAgICAgICBpZihhdmFpbGFibGVFdmVudHMuaW5kZXhPZihuYW1lKSA9PT0gLTEpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGV2ZW50IFxcJycgKyBuYW1lICsnXFwnIGlzIG5vdCBhdmFpbGFibGUgb24gc3RvcmVTZXJ2aWNlLicpO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihuYW1lLCBoYW5kbGVyKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0QnVpbGRlcicsIGZ1bmN0aW9uIChzb2NrZXRGYWN0b3J5LCBlbnYsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgICAgICAgICBpZihuYW1lc3BhY2UpXHJcbiAgICAgICAgICAgICAgICB1cmkgKz0gbmFtZXNwYWNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRldmljZUlkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteUlvU29ja2V0ID0gaW8uY29ubmVjdCh1cmksIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5OiAnZGV2aWNlPScgKyBkZXZpY2VJZFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteVNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbXlTb2NrZXQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ25vdGlmaWNhdGlvblNlcnZpY2UnLCBOb3RpZmljYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBOb3RpZmljYXRpb25TZXJ2aWNlKCRyb290U2NvcGUsIHNvY2tldEJ1aWxkZXIpe1xyXG5cclxuXHR2YXIgc29ja2V0ID0gc29ja2V0QnVpbGRlcignJyk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdC8vXHQkcm9vdFNjb3BlXHJcblx0fSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ2dlb0xvY2F0aW9uJywgR2VvTG9jYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBHZW9Mb2NhdGlvblNlcnZpY2UoJHEsICR3aW5kb3csICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgd2F0Y2hlckNvdW50ID0gMDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldEdwczogX2N1cnJlbnRQb3NpdGlvbixcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4LmNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBkZWZlci5yZWplY3QoJ1Blcm1pc3Npb24gRGVuaWVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQb3NpdGlvbiBVbmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGRlZmVyLnJlamVjdCgnVGltZW91dCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWZlci5yZWplY3QoJ1Vua293bicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4uaW50ZXJjZXB0b3JzJywgW10pXHJcblx0LmZhY3RvcnkoJ2RldmljZUludGVyY2VwdG9yJywgRGV2aWNlSW50ZXJjZXB0b3IpXHJcbiAgICAuY29uZmlnKGFkZEludGVyY2VwdG9ycyk7XHJcblxyXG5mdW5jdGlvbiBEZXZpY2VJbnRlcmNlcHRvcigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG5cdHJldHVybiB7XHJcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCFjb25maWcgfHwgIWNvbmZpZy5oZWFkZXJzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWyd4LWRldmljZSddID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRJbnRlcmNlcHRvcnMoJGh0dHBQcm92aWRlcil7XHJcblx0JGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZGV2aWNlSW50ZXJjZXB0b3InKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25maWcoX2NvbmZpZ3VyZUh0dHApO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIF9jb25maWd1cmVIdHRwKGh0dHBDbGllbnRQcm92aWRlciwgZW52KSB7XHJcbiAgICBodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuTmFtZSA9IFwidG9rZW5cIjtcclxuICAgIC8vaHR0cENsaWVudFByb3ZpZGVyLmF1dGhUb2tlblR5cGUgPSBcIkJlYXJlclwiO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=