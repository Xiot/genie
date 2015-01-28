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
            return storeService.requestHelp();
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
    angular.module('qarin').constant('env', { apiRoot: 'http://localhost:3000' });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFyZWFzL3RlbXAvb3V0c2lkZXNoZWxsLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0cy5tb2R1bGUuanMiLCJhcmVhcy9wcm9kdWN0cy9zZWFyY2guY29udHJvbGxlci5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3Quc2VydmljZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3QuY29udHJvbGxlci5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbG9jYXRvci5jb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xheW91dC5jb25maWcuanMiLCJhcmVhcy9sYXlvdXQvaGVhZGVyLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9ob21lL2hvbWUubW9kdWxlLmpzIiwiYXJlYXMvaG9tZS9ob21lLnJvdXRlcy5qcyIsImFyZWFzL2hvbWUvSG9tZUNvbnRyb2xsZXIuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLm1vZHVsZS5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMucm91dGVzLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5jb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9yLnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L2NoYXRsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvQ2hhdENvbnRyb2xsZXIuanMiLCJzZXJ2aWNlcy9zdG9yZVNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zb2NrZXRzLmpzIiwic2VydmljZXMvbm90aWZpY2F0aW9uLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9nZW9Mb2NhdGlvblNlcnZpY2UuanMiLCJzZXJ2aWNlcy9kZXZpY2VJbnRlcmNlcHRvci5qcyIsImRpcmVjdGl2ZXMvcWFTZXRTdG9yZUNsYXNzLmRpcmVjdGl2ZS5qcyIsImNvbmZpZy9odHRwLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJzdGF0ZSIsInVybCIsImFic3RyYWN0Iiwidmlld3MiLCJ0ZW1wbGF0ZVVybCIsInBhcmVudCIsInRlbXBsYXRlIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInJlc29sdmUiLCJjaGF0SWQiLCIkc3RhdGVQYXJhbXMiLCJpZCIsInJ1biIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkb24iLCJldmVudCIsInVuZm91bmRTdGF0ZSIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJ0b1BhcmFtcyIsIm9wdGlvbnMiLCJPdXRzaWRlU2hlbGxDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCJub2RlIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwid2luZG93IiwiYWRkU3R5bGVTdHJpbmciLCJzdHIiLCJpbm5lckhUTUwiLCJ2bSIsImV4dGVuZCIsInNldFN0b3JlIiwiX3NldFN0b3JlIiwic2V0U3RvcmVVc2luZ0xvY2F0aW9uIiwiX3NldFN0b3JlVXNpbmdMb2NhdGlvbiIsImdldEJ5SWQiLCJ0aGVuIiwic3RvcmUiLCJjdXJyZW50Iiwic2V0IiwiZ28iLCJyZW1vdmUiLCJnZXRDdXJyZW50U3RvcmUiLCJTZWFyY2hDb250cm9sbGVyIiwiaHR0cENsaWVudCIsInF1ZXJ5IiwiJGxvY2F0aW9uIiwicHJvZHVjdHMiLCJzZWFyY2giLCJfc2VhcmNoIiwiX2luaXQiLCJnZXQiLCJyZXMiLCJkYXRhIiwicmVsb2FkIiwicmVnaXN0ZXJSb3V0ZXMiLCJwcm9kdWN0IiwicHJvZHVjdFNlcnZpY2UiLCJwcm9kdWN0SWQiLCJmYWN0b3J5IiwiUHJvZHVjdFNlcnZpY2UiLCJzZXJ2aWNlIiwiX2dldFByb2R1Y3RCeUlkIiwiUHJvZHVjdENvbnRyb2xsZXIiLCJjaGF0U2VydmljZSIsImNyZWF0ZUNoYXQiLCJfY3JlYXRlQ2hhdCIsImNyZWF0ZSIsIl9pZCIsImNoYXQiLCJjYXRjaCIsImV4IiwiJHNjb3BlIiwic29ja2V0Iiwib24iLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJlIiwidG9TdGF0ZSIsInByZXZlbnREZWZhdWx0IiwicmV0IiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsIm5hbWUiLCJ1bnNoaWZ0IiwiYXJncyIsImNvbmZpZ3VyZVJvdXRlcyIsIkhvbWVDb250cm9sbGVyIiwiJGh0dHAiLCJlbnYiLCJyZXF1ZXN0SGVscCIsIl9yZXF1ZXN0SGVscCIsIkVycm9yQ29udHJvbGxlciIsImVycm9yIiwiRXJyb3JTZXJ2aWNlIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdHMiLCJfY3JlYXRlTmV3Q2hhdCIsIm9wdHMiLCJwYXJhbXMiLCJwYXJzZSIsIm1hcCIsIngiLCJDaGF0IiwibXlEZXZpY2VJZCIsIm90aGVycyIsInBhcnRpY2lwYW50cyIsImZvckVhY2giLCJkZXZpY2UiLCJwdXNoIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJqb2luIiwibGFzdE1lc3NhZ2UiLCJtZXNzYWdlcyIsInNsaWNlIiwiQ2hhdEZhY3RvcnkiLCJzZW5kTWVzc2FnZSIsImluaXQiLCJtZXNzYWdlIiwicG9zdCIsIiRlbWl0Iiwic2VuZCIsIm1zZyIsInRpbWUiLCJ1c2VyIiwic2VudCIsIlN0b3JlU2VydmljZSIsImdlb0xvY2F0aW9uIiwiX2N1cnJlbnQiLCJhdmFpbGFibGVFdmVudHMiLCJfZ2V0QnlJZCIsIl9nZXRDdXJyZW50U3RvcmUiLCJfcmVnaXN0ZXJMaXN0ZW5lciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiX2dldF9jdXJyZW50IiwiX3NldF9jdXJyZW50IiwiZW51bWVyYWJsZSIsInJlcXVlc3QiLCJ0eXBlIiwidmFsdWUiLCJzdG9yZWRTdG9yZSIsImdldEdwcyIsImdwcyIsImxhdCIsImNvb3JkcyIsImxhdGl0dWRlIiwibG5nIiwibG9uZ2l0dWRlIiwicmVzcG9uc2UiLCJsZW5ndGgiLCJoYW5kbGVyIiwiaW5kZXhPZiIsIkVycm9yIiwic29ja2V0RmFjdG9yeSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJ1cmkiLCJhcGlSb290IiwiZGV2aWNlSWQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJOb3RpZmljYXRpb25TZXJ2aWNlIiwiR2VvTG9jYXRpb25TZXJ2aWNlIiwiJHEiLCIkd2luZG93Iiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCJwb3MiLCIkYXBwbHkiLCJjb2RlIiwicHJvbWlzZSIsIkRldmljZUludGVyY2VwdG9yIiwiYWRkSW50ZXJjZXB0b3JzIiwiaGVhZGVycyIsImludGVyY2VwdG9ycyIsImRpcmVjdGl2ZSIsInNldFN0b3JlQ2xhc3MiLCJsaW5rIiwiX2xpbmtGbiIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwiYXR0ciIsIm9yZ2FuaXphdGlvbiIsImFsaWFzIiwiX2NvbmZpZ3VyZUh0dHAiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCJiYXNlVXJpIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBQUpBLFFBQVFDLE9BQU8sU0FBUztRQUNwQjtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBRUE7UUFDQTtRQUVBO1FBQ0E7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R0FBR1ksTUFBSzs7Z0JBRWhEMEcsUUFBUUUsS0FBSyxNQUFNNUcsS0FBS3ZELE1BQU1vSyxhQUFhQzs7Ozs7S0FEekM7QUNiTCxDQUFDLFlBQVk7SUFDVDtJQURKMU4sUUFBUUMsT0FBTyxTQUNkQyxPQUFPeU47O0lBR1IsU0FBU0EsZUFBZUMsb0JBQW9CNUcsS0FBSztRQUM3QzRHLG1CQUFtQkMsVUFBVTdHLElBQUlzRTs7OztLQUdoQztBQ1JMLENBQUMsWUFBWTtJQUNUO0lBREp0TCxRQUFRQyxPQUFPLFNBQ2Q2TixTQUFTLE9BQU8sRUFDYnhDLFNBQVM7S0FDUiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJywgWyAgICBcclxuICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgJ3FhcmluLnBhcnRpYWxzJyxcclxuICAgICd1aS5yb3V0ZXInLFxyXG4gICAgJ25nQW5pbWF0ZScsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbycsXHJcblxyXG4gICAgJ3FhcmluLmludGVyY2VwdG9ycycsXHJcbiAgICAncWFyaW4uZXJyb3JzJyxcclxuICAgIFxyXG4gICAgJ3FhcmluLmhvbWUnLFxyXG4gICAgJ3FhcmluLnByb2R1Y3RzJ1xyXG5cclxuICAgIF0pXHJcblxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICAgXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgICAuc3RhdGUoJ3Jvb3QnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB2aWV3czoge1xyXG4gICAgICAgICAgICAgICAgJyc6IHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdSb290Q29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbGF5b3V0L2xheW91dC5odG1sJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gLFxyXG4gICAgICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnRyb2xsZXI6ICdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnXHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbGF5b3V0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHVpLXZpZXc+PC91aS12aWV3PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvY2hhdCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQvOmlkJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlUGFyYW1zLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ091dHNpZGVTaGVsbENvbnRyb2xsZXInLCBPdXRzaWRlU2hlbGxDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIE91dHNpZGVTaGVsbENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBzdG9yYWdlU2VydmljZSwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xyXG5cdHdpbmRvdy5hZGRTdHlsZVN0cmluZyA9IGZ1bmN0aW9uKHN0cikge1xyXG5cdFx0bm9kZS5pbm5lckhUTUwgPSBzdHI7XHJcblx0fVxyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRzZXRTdG9yZTogX3NldFN0b3JlLFxyXG5cdFx0c2V0U3RvcmVVc2luZ0xvY2F0aW9uOiBfc2V0U3RvcmVVc2luZ0xvY2F0aW9uLFxyXG5cdH0pO1xyXG5cclxuXHRmdW5jdGlvbiBfc2V0U3RvcmUoaWQpIHtcdFx0XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldEJ5SWQoaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3JlKSB7XHJcblx0XHRcdFx0c3RvcmVTZXJ2aWNlLmN1cnJlbnQgPSBzdG9yZTtcclxuXHRcdFx0XHRzdG9yYWdlU2VydmljZS5zZXQoJ3N0b3JlJywgaWQsIHRydWUpO1xyXG5cclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHN0b3JlO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRTdG9yZVVzaW5nTG9jYXRpb24oKSB7XHJcblx0XHRcclxuXHRcdHN0b3JhZ2VTZXJ2aWNlLnJlbW92ZSgnc3RvcmUnKTtcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0Q3VycmVudFN0b3JlKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmUpIHtcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XHJcblxyXG5cdFx0XHRcdHJldHVybiBzdG9yZTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBTZWFyY2hDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBTZWFyY2hDb250cm9sbGVyKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSwgcXVlcnksICRzdGF0ZSwgJGxvY2F0aW9uKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdHM6IFtdLFxyXG5cdFx0cXVlcnk6IHF1ZXJ5IHx8ICcnLFxyXG5cdFx0c2VhcmNoOiBfc2VhcmNoXHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCl7XHJcblx0XHQgaWYoIXZtLnF1ZXJ5KVxyXG5cdFx0IFx0cmV0dXJuO1xyXG5cdFx0Ly8gXHRfc2VhcmNoKCk7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvcHJvZHVjdHM/c2VhcmNoPScgKyB2bS5xdWVyeTtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KHVybClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblx0XHRcdHZtLnByb2R1Y3RzID0gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZWFyY2goKXtcclxuXHJcblx0XHQvLyB2YXIgb3JpZ2luYWxVcmwgPSAkbG9jYXRpb24udXJsKCk7XHJcblx0XHQvLyB2YXIgdXJsID0gJHN0YXRlLmhyZWYoJ3NlYXJjaCcsIHtxdWVyeTogdm0ucXVlcnl9KTtcclxuXHRcdC8vIGlmKG9yaWdpbmFsVXJsICE9PSB1cmwpXHJcblx0XHQvLyBcdCRsb2NhdGlvbi51cmwodXJsKTtcclxuXHRcdC8vJGxvY2F0aW9uLnB1c2hcclxuXHRcdCRzdGF0ZS5nbygnc2VhcmNoJywge3F1ZXJ5OiB2bS5xdWVyeX0sIHtyZWxvYWQ6IHRydWV9KTtcclxuXHRcdFxyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcblx0LmNvbmZpZyhyZWdpc3RlclJvdXRlcylcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiByZWdpc3RlclJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcclxuXHRcdHVybDogJy9zZWFyY2g/cXVlcnknLFxyXG5cdFx0Y29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvc2VhcmNoLmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRxdWVyeTogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuXHRcdFx0XHRyZXR1cm4gJHN0YXRlUGFyYW1zLnF1ZXJ5O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSlcclxuXHQuc3RhdGUoJ3Byb2R1Y3QnLCB7XHJcblx0XHR1cmw6ICcvcHJvZHVjdC86cHJvZHVjdElkJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9wcm9kdWN0cy9wcm9kdWN0Lmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRwcm9kdWN0OiBmdW5jdGlvbihwcm9kdWN0U2VydmljZSwgJHN0YXRlUGFyYW1zKXtcclxuXHRcdFx0XHRyZXR1cm4gcHJvZHVjdFNlcnZpY2UuZ2V0KCRzdGF0ZVBhcmFtcy5wcm9kdWN0SWQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5mYWN0b3J5KCdwcm9kdWN0U2VydmljZScsIFByb2R1Y3RTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFByb2R1Y3RTZXJ2aWNlKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldDogX2dldFByb2R1Y3RCeUlkXHJcblx0fTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRQcm9kdWN0QnlJZChpZCkge1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL3Byb2R1Y3RzLycgKyBpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBQcm9kdWN0Q29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gUHJvZHVjdENvbnRyb2xsZXIocHJvZHVjdFNlcnZpY2UsIHByb2R1Y3QsICRzdGF0ZSwgY2hhdFNlcnZpY2Upe1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRwcm9kdWN0OiBwcm9kdWN0LFxyXG5cdFx0Y3JlYXRlQ2hhdDogX2NyZWF0ZUNoYXRcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZUNoYXQoKXtcclxuXHJcblx0XHRjaGF0U2VydmljZS5jcmVhdGUoe3Byb2R1Y3Q6IHByb2R1Y3QuX2lkfSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGNoYXQpe1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IGNoYXQuX2lkfSk7XHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGV4KTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQub24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuICAgIH0pO1xyXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIHN0b3JlU2VydmljZSwgZXJyb3JTZXJ2aWNlKSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdC8vIGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdC8vIFx0cmV0dXJuO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cdFx0aWYoc3RvcmUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0JHN0YXRlLmdvKHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuXHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xyXG5cdFx0XHRlcnJvclNlcnZpY2UubGFzdEVycm9yID0gZXJyO1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2Vycm9yJyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdC8vIFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHQvLyBcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHQvLyBcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIHNvY2tldCwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuXHRcdG5vdGlmaWNhdGlvbnM6IFtdXHJcblx0fSk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuXHRcdHZhciBub3RpZmljYXRpb24gPSB7XHJcblx0XHRcdG5hbWU6ICdtZXNzYWdlJyxcclxuXHRcdFx0ZGF0YTogZGF0YSxcclxuXHRcdFx0Z286IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdjaGF0KHtpZDogZGF0YS5jaGF0fSknKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dm0ubm90aWZpY2F0aW9ucy51bnNoaWZ0KG5vdGlmaWNhdGlvbik7XHJcblxyXG5cdH0pO1xyXG5cclxuXHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3MpIHtcclxuXHRcdHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHBcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0SGVscCgpIHsgXHJcbiAgICAgICAgcmV0dXJuIHN0b3JlU2VydmljZS5yZXF1ZXN0SGVscCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG4gICAgICAgIHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuICAgIH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdlcnJvcicsIHtcclxuXHRcdHVybDogJy9lcnJvcicsXHJcblx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFcnJvcnNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Vycm9ycy9lcnJvci5odG1sJ1xyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbnRyb2xsZXIoJ0Vycm9yQ29udHJvbGxlcicsIEVycm9yQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JDb250cm9sbGVyKGVycm9yU2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlcnJvcjogZXJyb3JTZXJ2aWNlLmxhc3RFcnJvclxyXG5cdH0pO1xyXG5cclxuJHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcbi5mYWN0b3J5KCdlcnJvclNlcnZpY2UnLCBFcnJvclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yU2VydmljZSgpe1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGxhc3RFcnJvcjogbnVsbFxyXG5cdH07XHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsICRzdGF0ZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlTmV3Q2hhdCgpe1xyXG5cclxuXHRcdGNoYXRTZXJ2aWNlLmNyZWF0ZSgpXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcpXHJcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0Ly8gXHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IHJlcy5kYXRhLl9pZH0pO1xyXG5cdFx0Ly8gfSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcblxyXG5cdHJldHVybiBkYXRhLm1hcChmdW5jdGlvbih4KSB7XHJcblx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHQvLyBjb3B5IHJhdyBwcm9wZXJ0aWVzXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XHJcblxyXG5cdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHR2YXIgb3RoZXJzID0gW107XHJcblxyXG5cdGRhdGEucGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xyXG5cdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0b3RoZXJzLnB1c2goeC5maXJzdE5hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnVzZXJzID0gb3RoZXJzLmpvaW4oJywgJyk7XHJcblxyXG5cdHRoaXMubGFzdE1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2VzLnNsaWNlKC0xKVswXTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGNyZWF0ZTogX2NyZWF0ZUNoYXRcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge21lc3NhZ2U6IG1lc3NhZ2V9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlQ2hhdChvcHRzKXtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcsIG9wdHMpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhKTtcclxuXHRcdFx0JHJvb3RTY29wZS4kZW1pdCgnY2hhdC1tZXNzYWdlJywgZGF0YSk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0SWQsIGh0dHBDbGllbnQsICRyb290U2NvcGUsIGNoYXRTZXJ2aWNlKSB7XHJcblxyXG5cdFx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0XHRjaGF0OiBudWxsLFxyXG5cdFx0XHRzZW5kOiBzZW5kTWVzc2FnZSxcclxuXHRcdFx0bWVzc2FnZTogJycsXHJcblx0XHRcdHByb2R1Y3Q6IG51bGxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgY2hhdElkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0ID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpIHtcclxuXHRcdFx0dm0uY2hhdC5tZXNzYWdlcy5wdXNoKG1zZyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuXHRcdFx0dmFyIG1lc3NhZ2UgPSB2bS5tZXNzYWdlO1xyXG5cdFx0XHR2bS5tZXNzYWdlID0gJyc7XHJcblxyXG5cdFx0XHRjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0SWQsIG1lc3NhZ2UpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoZ2VvTG9jYXRpb24sIGh0dHBDbGllbnQsICRyb290U2NvcGUsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciBfY3VycmVudCA9IG51bGw7XHJcblx0dmFyIGF2YWlsYWJsZUV2ZW50cyA9IFsnc3RvcmVDaGFuZ2VkJ107XHJcblxyXG5cdHZhciBzZXJ2aWNlID0ge1xyXG5cdFx0Z2V0QnlJZDogX2dldEJ5SWQsXHJcblx0XHRnZXRDdXJyZW50U3RvcmU6IF9nZXRDdXJyZW50U3RvcmUsXHJcblx0XHRvbjogX3JlZ2lzdGVyTGlzdGVuZXIsXHJcblx0XHRyZXF1ZXN0SGVscDogcmVxdWVzdEhlbHBcclxuXHR9O1xyXG5cclxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnQnLCB7XHJcblx0XHRnZXQ6IF9nZXRfY3VycmVudCxcclxuXHRcdHNldDogX3NldF9jdXJyZW50LFxyXG5cdFx0ZW51bWVyYWJsZTogdHJ1ZVxyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gcmVxdWVzdEhlbHAoKSB7XHJcblx0XHR2YXIgcmVxdWVzdCA9IHtcclxuXHRcdFx0dHlwZTogJ3JlcXVlc3QnLFxyXG5cdFx0XHQvL2N1c3RvbWVyOiBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpLFxyXG5cdFx0fTtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9zdG9yZXMvJyArIF9jdXJyZW50LmlkICsgJy90YXNrcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwgcmVxdWVzdClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRfY3VycmVudCgpIHtcclxuXHRcdHJldHVybiBfY3VycmVudDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRfY3VycmVudCh2YWx1ZSkge1xyXG5cdFx0X2N1cnJlbnQgPSB2YWx1ZTtcclxuXHRcdCRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtcclxuXHRcdFx0c3RvcmU6IF9jdXJyZW50XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRCeUlkKGlkKSB7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2dldEN1cnJlbnRTdG9yZSgpIHtcclxuXHJcblx0XHR2YXIgc3RvcmVkU3RvcmUgPSBzdG9yYWdlU2VydmljZS5nZXQoJ3N0b3JlJyk7XHJcblx0XHRpZiAoc3RvcmVkU3RvcmUpIHtcclxuXHJcblx0XHRcdHJldHVybiBfZ2V0QnlJZChzdG9yZWRTdG9yZSlcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZSkge1xyXG5cdFx0XHRcdFx0X2N1cnJlbnQgPSBzdG9yZTtcclxuXHRcdFx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtcclxuXHRcdFx0XHRcdFx0c3RvcmU6IF9jdXJyZW50XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2VvTG9jYXRpb24uZ2V0R3BzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oZ3BzKSB7XHJcblxyXG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7XHJcblx0XHRcdFx0XHRsYXQ6IGdwcy5jb29yZHMubGF0aXR1ZGUsXHJcblx0XHRcdFx0XHRsbmc6IGdwcy5jb29yZHMubG9uZ2l0dWRlXHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvbG9jYXRpb25zJywge1xyXG5cdFx0XHRcdFx0XHRwYXJhbXM6IHBhcmFtc1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+PSAxKSB7XHJcblx0XHRcdFx0XHRcdFx0X2N1cnJlbnQgPSByZXNwb25zZS5kYXRhWzBdO1xyXG5cclxuXHRcdFx0XHRcdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRzdG9yZTogX2N1cnJlbnRcclxuXHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gX2N1cnJlbnQ7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfcmVnaXN0ZXJMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKSB7XHJcblxyXG5cdFx0aWYgKGF2YWlsYWJsZUV2ZW50cy5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgZXZlbnQgXFwnJyArIG5hbWUgKyAnXFwnIGlzIG5vdCBhdmFpbGFibGUgb24gc3RvcmVTZXJ2aWNlLicpO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKG5hbWUsIGhhbmRsZXIpO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0QnVpbGRlcicsIGZ1bmN0aW9uIChzb2NrZXRGYWN0b3J5LCBlbnYsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgICAgICAgICBpZihuYW1lc3BhY2UpXHJcbiAgICAgICAgICAgICAgICB1cmkgKz0gbmFtZXNwYWNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRldmljZUlkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteUlvU29ja2V0ID0gaW8uY29ubmVjdCh1cmksIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5OiAnZGV2aWNlPScgKyBkZXZpY2VJZFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteVNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbXlTb2NrZXQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ25vdGlmaWNhdGlvblNlcnZpY2UnLCBOb3RpZmljYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBOb3RpZmljYXRpb25TZXJ2aWNlKCRyb290U2NvcGUsIHNvY2tldEJ1aWxkZXIpe1xyXG5cclxuXHR2YXIgc29ja2V0ID0gc29ja2V0QnVpbGRlcignJyk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdC8vXHQkcm9vdFNjb3BlXHJcblx0fSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ2dlb0xvY2F0aW9uJywgR2VvTG9jYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBHZW9Mb2NhdGlvblNlcnZpY2UoJHEsICR3aW5kb3csICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgd2F0Y2hlckNvdW50ID0gMDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldEdwczogX2N1cnJlbnRQb3NpdGlvbixcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4LmNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBkZWZlci5yZWplY3QoJ1Blcm1pc3Npb24gRGVuaWVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQb3NpdGlvbiBVbmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGRlZmVyLnJlamVjdCgnVGltZW91dCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWZlci5yZWplY3QoJ1Vua293bicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4uaW50ZXJjZXB0b3JzJywgW10pXHJcblx0LmZhY3RvcnkoJ2RldmljZUludGVyY2VwdG9yJywgRGV2aWNlSW50ZXJjZXB0b3IpXHJcbiAgICAuY29uZmlnKGFkZEludGVyY2VwdG9ycyk7XHJcblxyXG5mdW5jdGlvbiBEZXZpY2VJbnRlcmNlcHRvcigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG5cdHJldHVybiB7XHJcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCFjb25maWcgfHwgIWNvbmZpZy5oZWFkZXJzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWyd4LWRldmljZSddID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRJbnRlcmNlcHRvcnMoJGh0dHBQcm92aWRlcil7XHJcblx0JGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZGV2aWNlSW50ZXJjZXB0b3InKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5kaXJlY3RpdmUoJ3FhU2V0U3RvcmVDbGFzcycsIHNldFN0b3JlQ2xhc3MpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIHNldFN0b3JlQ2xhc3Moc3RvcmVTZXJ2aWNlKXtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpbms6IF9saW5rRm5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9saW5rRm4oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuXHJcblx0XHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG5cdFx0XHQvL2F0dHJzLmlkID0gYXJncy5zdG9yZS5vcmdhbml6YXRpb24uYWxpYXM7XHJcblx0XHRcdGVsZW1lbnQuYXR0cihcImlkXCIsIGFyZ3Muc3RvcmUub3JnYW5pemF0aW9uLmFsaWFzKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25maWcoX2NvbmZpZ3VyZUh0dHApO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIF9jb25maWd1cmVIdHRwKGh0dHBDbGllbnRQcm92aWRlciwgZW52KSB7XHJcbiAgICBodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuTmFtZSA9IFwidG9rZW5cIjtcclxuICAgIC8vaHR0cENsaWVudFByb3ZpZGVyLmF1dGhUb2tlblR5cGUgPSBcIkJlYXJlclwiO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=