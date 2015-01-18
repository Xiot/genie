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
    function OutsideShellController(storeService, storageService) {
        var node = document.createElement('style');
        document.body.appendChild(node);
        window.addStyleString = function (str) {
            node.innerHTML = str;
        };
        var vm = angular.extend(this, {
            setStore: _setStore,
            setStoreUsingLocation: _setStoreUsingLocation,
            themeOne: function () {
                node.innerHTML = '.device-root {background-color: white}';
            },
            themeTwo: function () {
                node.innerHTML = '.device-root {background-color: green}';
            }
        });
        function _setStore(id) {
            return storeService.getById(id).then(function (store) {
                storeService.current = store;
                storageService.set('store', id, true);
                return store;
            });
        }
        function _setStoreUsingLocation() {
            storeService.remove('store');
            return storeService.getCurrentStore().then(function (store) {
                return store;
            });
        }
    }
    OutsideShellController.$inject = ["storeService", "storageService"];
}());
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
    function StoreService(geoLocation, httpClient, $rootScope, storageService) {
        var _current = null;
        var availableEvents = ['storeChanged'];
        var service = {
            getById: _getById,
            getCurrentStore: _getCurrentStore,
            on: _registerListener
        };
        Object.defineProperty(service, 'current', {
            get: _get_current,
            set: _set_current,
            enumerable: true
        });
        return service;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFyZWFzL3RlbXAvb3V0c2lkZXNoZWxsLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0cy5tb2R1bGUuanMiLCJhcmVhcy9wcm9kdWN0cy9zZWFyY2guY29udHJvbGxlci5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3Quc2VydmljZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3QuY29udHJvbGxlci5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbG9jYXRvci5jb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xheW91dC5jb25maWcuanMiLCJhcmVhcy9sYXlvdXQvaGVhZGVyLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9ob21lL2hvbWUubW9kdWxlLmpzIiwiYXJlYXMvaG9tZS9ob21lLnJvdXRlcy5qcyIsImFyZWFzL2hvbWUvSG9tZUNvbnRyb2xsZXIuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLm1vZHVsZS5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMucm91dGVzLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5jb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9yLnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L2NoYXRsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvQ2hhdENvbnRyb2xsZXIuanMiLCJzZXJ2aWNlcy9zdG9yZVNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zb2NrZXRzLmpzIiwic2VydmljZXMvbm90aWZpY2F0aW9uLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9nZW9Mb2NhdGlvblNlcnZpY2UuanMiLCJzZXJ2aWNlcy9kZXZpY2VJbnRlcmNlcHRvci5qcyIsImRpcmVjdGl2ZXMvcWFTZXRTdG9yZUNsYXNzLmRpcmVjdGl2ZS5qcyIsImNvbmZpZy9odHRwLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJzdGF0ZSIsInVybCIsImFic3RyYWN0Iiwidmlld3MiLCJ0ZW1wbGF0ZVVybCIsInBhcmVudCIsInRlbXBsYXRlIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInJlc29sdmUiLCJjaGF0SWQiLCIkc3RhdGVQYXJhbXMiLCJpZCIsInJ1biIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkb24iLCJldmVudCIsInVuZm91bmRTdGF0ZSIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJ0b1BhcmFtcyIsIm9wdGlvbnMiLCJPdXRzaWRlU2hlbGxDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCJub2RlIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwid2luZG93IiwiYWRkU3R5bGVTdHJpbmciLCJzdHIiLCJpbm5lckhUTUwiLCJ2bSIsImV4dGVuZCIsInNldFN0b3JlIiwiX3NldFN0b3JlIiwic2V0U3RvcmVVc2luZ0xvY2F0aW9uIiwiX3NldFN0b3JlVXNpbmdMb2NhdGlvbiIsInRoZW1lT25lIiwidGhlbWVUd28iLCJnZXRCeUlkIiwidGhlbiIsInN0b3JlIiwiY3VycmVudCIsInNldCIsInJlbW92ZSIsImdldEN1cnJlbnRTdG9yZSIsIlNlYXJjaENvbnRyb2xsZXIiLCJodHRwQ2xpZW50IiwicHJvZHVjdHMiLCJxdWVyeSIsInNlYXJjaCIsIl9zZWFyY2giLCJnZXQiLCJyZXMiLCJkYXRhIiwiX2luaXQiLCJvcHRzIiwicGFyYW1zIiwiY2hhdHMiLCJwYXJzZSIsInJlZ2lzdGVyUm91dGVzIiwicHJvZHVjdCIsInByb2R1Y3RTZXJ2aWNlIiwicHJvZHVjdElkIiwiZmFjdG9yeSIsIlByb2R1Y3RTZXJ2aWNlIiwic2VydmljZSIsIl9nZXRQcm9kdWN0QnlJZCIsIlByb2R1Y3RDb250cm9sbGVyIiwiY2hhdFNlcnZpY2UiLCJjcmVhdGVDaGF0IiwiX2NyZWF0ZUNoYXQiLCJjcmVhdGUiLCJfaWQiLCJjaGF0IiwiZ28iLCJjYXRjaCIsImV4IiwiJHNjb3BlIiwic29ja2V0Iiwib24iLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJlIiwidG9TdGF0ZSIsInByZXZlbnREZWZhdWx0IiwicmV0IiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsIm5hbWUiLCJ1bnNoaWZ0IiwiYXJncyIsImNvbmZpZ3VyZVJvdXRlcyIsIkhvbWVDb250cm9sbGVyIiwiJGh0dHAiLCJlbnYiLCJyZXF1ZXN0SGVscCIsIl9yZXF1ZXN0SGVscCIsImVtaXQiLCJzdG9yZV9pZCIsIkVycm9yQ29udHJvbGxlciIsImVycm9yIiwiRXJyb3JTZXJ2aWNlIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiX2NyZWF0ZU5ld0NoYXQiLCJtYXAiLCJ4IiwiQ2hhdCIsIm15RGV2aWNlSWQiLCJvdGhlcnMiLCJwYXJ0aWNpcGFudHMiLCJmb3JFYWNoIiwiZGV2aWNlIiwicHVzaCIsImZpcnN0TmFtZSIsInVzZXJzIiwiam9pbiIsImxhc3RNZXNzYWdlIiwibWVzc2FnZXMiLCJzbGljZSIsIkNoYXRGYWN0b3J5Iiwic2VuZE1lc3NhZ2UiLCJpbml0IiwibWVzc2FnZSIsInBvc3QiLCIkZW1pdCIsInNlbmQiLCJtc2ciLCJ0aW1lIiwidXNlciIsInNlbnQiLCJTdG9yZVNlcnZpY2UiLCJnZW9Mb2NhdGlvbiIsIl9jdXJyZW50IiwiYXZhaWxhYmxlRXZlbnRzIiwiX2dldEJ5SWQiLCJfZ2V0Q3VycmVudFN0b3JlIiwiX3JlZ2lzdGVyTGlzdGVuZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsIl9nZXRfY3VycmVudCIsIl9zZXRfY3VycmVudCIsImVudW1lcmFibGUiLCJ2YWx1ZSIsInN0b3JlZFN0b3JlIiwiZ2V0R3BzIiwiZ3BzIiwibGF0IiwiY29vcmRzIiwibGF0aXR1ZGUiLCJsbmciLCJsb25naXR1ZGUiLCJyZXNwb25zZSIsImxlbmd0aCIsImhhbmRsZXIiLCJpbmRleE9mIiwiRXJyb3IiLCJzb2NrZXRGYWN0b3J5IiwiYnVpbGRlciIsIm5hbWVzcGFjZSIsInVyaSIsImFwaVJvb3QiLCJkZXZpY2VJZCIsIm15SW9Tb2NrZXQiLCJpbyIsImNvbm5lY3QiLCJteVNvY2tldCIsImlvU29ja2V0Iiwic29ja2V0QnVpbGRlciIsIk5vdGlmaWNhdGlvblNlcnZpY2UiLCJHZW9Mb2NhdGlvblNlcnZpY2UiLCIkcSIsIiR3aW5kb3ciLCJ3YXRjaGVyQ291bnQiLCJfY3VycmVudFBvc2l0aW9uIiwibmF2aWdhdG9yIiwiZ2VvbG9jYXRpb24iLCJyZWplY3QiLCJkZWZlciIsImdldEN1cnJlbnRQb3NpdGlvbiIsInBvcyIsIiRhcHBseSIsImNvZGUiLCJwcm9taXNlIiwiRGV2aWNlSW50ZXJjZXB0b3IiLCJhZGRJbnRlcmNlcHRvcnMiLCJyZXF1ZXN0IiwiaGVhZGVycyIsImludGVyY2VwdG9ycyIsImRpcmVjdGl2ZSIsInNldFN0b3JlQ2xhc3MiLCJsaW5rIiwiX2xpbmtGbiIsInNjb3BlIiwiZWxlbWVudCIsImF0dHJzIiwiYXR0ciIsIm9yZ2FuaXphdGlvbiIsImFsaWFzIiwiX2NvbmZpZ3VyZUh0dHAiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCJiYXNlVXJpIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBQUpBLFFBQVFDLE9BQU8sU0FBUztRQUNwQjtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBRUE7UUFD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QUFtQkMsVUFBVTFHLElBQUlrRTs7OztLQUdoQztBQ1JMLENBQUMsWUFBWTtJQUNUO0lBREp0TCxRQUFRQyxPQUFPLFNBQ2Q4TixTQUFTLE9BQU8sRUFDYnpDLFNBQVM7S0FDUiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJywgWyAgICBcclxuICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgJ3FhcmluLnBhcnRpYWxzJyxcclxuICAgICd1aS5yb3V0ZXInLFxyXG4gICAgJ25nQW5pbWF0ZScsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbycsXHJcblxyXG4gICAgJ3FhcmluLmludGVyY2VwdG9ycycsXHJcbiAgICAncWFyaW4uZXJyb3JzJyxcclxuICAgIFxyXG4gICAgJ3FhcmluLmhvbWUnLFxyXG4gICAgJ3FhcmluLnByb2R1Y3RzJ1xyXG5cclxuICAgIF0pXHJcblxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICAgXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgICAuc3RhdGUoJ3Jvb3QnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB2aWV3czoge1xyXG4gICAgICAgICAgICAgICAgJyc6IHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdSb290Q29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbGF5b3V0L2xheW91dC5odG1sJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gLFxyXG4gICAgICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnRyb2xsZXI6ICdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnXHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbGF5b3V0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHVpLXZpZXc+PC91aS12aWV3PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvY2hhdCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQvOmlkJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlUGFyYW1zLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ091dHNpZGVTaGVsbENvbnRyb2xsZXInLCBPdXRzaWRlU2hlbGxDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIE91dHNpZGVTaGVsbENvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuXHR2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcclxuXHR3aW5kb3cuYWRkU3R5bGVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcclxuXHRcdG5vZGUuaW5uZXJIVE1MID0gc3RyO1xyXG5cdH1cclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0c2V0U3RvcmU6IF9zZXRTdG9yZSxcclxuXHRcdHNldFN0b3JlVXNpbmdMb2NhdGlvbjogX3NldFN0b3JlVXNpbmdMb2NhdGlvbixcclxuXHJcblx0XHR0aGVtZU9uZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdG5vZGUuaW5uZXJIVE1MID0gXCIuZGV2aWNlLXJvb3Qge2JhY2tncm91bmQtY29sb3I6IHdoaXRlfVwiO1xyXG5cdFx0fSxcclxuXHRcdHRoZW1lVHdvOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0bm9kZS5pbm5lckhUTUwgPSBcIi5kZXZpY2Utcm9vdCB7YmFja2dyb3VuZC1jb2xvcjogZ3JlZW59XCI7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRTdG9yZShpZCkge1x0XHRcclxuXHRcdHJldHVybiBzdG9yZVNlcnZpY2UuZ2V0QnlJZChpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3RvcmUpIHtcclxuXHRcdFx0XHRzdG9yZVNlcnZpY2UuY3VycmVudCA9IHN0b3JlO1xyXG5cdFx0XHRcdHN0b3JhZ2VTZXJ2aWNlLnNldCgnc3RvcmUnLCBpZCwgdHJ1ZSk7XHJcblx0XHRcdFx0cmV0dXJuIHN0b3JlO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9zZXRTdG9yZVVzaW5nTG9jYXRpb24oKSB7XHJcblx0XHRcclxuXHRcdHN0b3JlU2VydmljZS5yZW1vdmUoJ3N0b3JlJyk7XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldEN1cnJlbnRTdG9yZSgpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3JlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHN0b3JlO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnLCBbJ3VpLnJvdXRlciddKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignU2VhcmNoQ29udHJvbGxlcicsIFNlYXJjaENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFNlYXJjaENvbnRyb2xsZXIoaHR0cENsaWVudCwgc3RvcmVTZXJ2aWNlKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdHM6IFtdLFxyXG5cdFx0cXVlcnk6ICcnLFxyXG5cdFx0c2VhcmNoOiBfc2VhcmNoXHJcblx0fSk7XHJcblxyXG5cclxuXHRmdW5jdGlvbiBfc2VhcmNoKCl7XHJcblxyXG5cdFx0dmFyIHVybCA9ICcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvcHJvZHVjdHM/c2VhcmNoPScgKyB2bS5xdWVyeTtcclxuXHRcdGh0dHBDbGllbnQuZ2V0KHVybClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcblx0XHRcdHZtLnByb2R1Y3RzID0gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcblx0LmNvbmZpZyhyZWdpc3RlclJvdXRlcylcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiByZWdpc3RlclJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcclxuXHRcdHVybDogJy9zZWFyY2gnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvc2VhcmNoLmh0bWwnXHJcblx0fSlcclxuXHQuc3RhdGUoJ3Byb2R1Y3QnLCB7XHJcblx0XHR1cmw6ICcvcHJvZHVjdC86cHJvZHVjdElkJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9wcm9kdWN0cy9wcm9kdWN0Lmh0bWwnLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRwcm9kdWN0OiBmdW5jdGlvbihwcm9kdWN0U2VydmljZSwgJHN0YXRlUGFyYW1zKXtcclxuXHRcdFx0XHRyZXR1cm4gcHJvZHVjdFNlcnZpY2UuZ2V0KCRzdGF0ZVBhcmFtcy5wcm9kdWN0SWQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5mYWN0b3J5KCdwcm9kdWN0U2VydmljZScsIFByb2R1Y3RTZXJ2aWNlKTtcclxuXHJcbmZ1bmN0aW9uIFByb2R1Y3RTZXJ2aWNlKGh0dHBDbGllbnQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGdldDogX2dldFByb2R1Y3RCeUlkXHJcblx0fTtcclxuXHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcblxyXG5cdGZ1bmN0aW9uIF9nZXRQcm9kdWN0QnlJZChpZCkge1xyXG5cclxuXHRcdHJldHVybiBodHRwQ2xpZW50LmdldCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL3Byb2R1Y3RzLycgKyBpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBQcm9kdWN0Q29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gUHJvZHVjdENvbnRyb2xsZXIocHJvZHVjdFNlcnZpY2UsIHByb2R1Y3QsICRzdGF0ZSwgY2hhdFNlcnZpY2Upe1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRwcm9kdWN0OiBwcm9kdWN0LFxyXG5cdFx0Y3JlYXRlQ2hhdDogX2NyZWF0ZUNoYXRcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZUNoYXQoKXtcclxuXHJcblx0XHRjaGF0U2VydmljZS5jcmVhdGUoe3Byb2R1Y3Q6IHByb2R1Y3QuX2lkfSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKGNoYXQpe1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IGNoYXQuX2lkfSk7XHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihleCl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGV4KTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzb2NrZXQub24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuICAgIH0pO1xyXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihlbnN1cmVBdXRoZW50aWNhdGVkKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBlbnN1cmVBdXRoZW50aWNhdGVkKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIHN0b3JlU2VydmljZSwgZXJyb3JTZXJ2aWNlKSB7XHJcblx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gdHJ1ZTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZSwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cclxuXHRcdC8vIGlmICh0b1N0YXRlLm5hbWUgPT09ICdsb2dpbicpIHtcclxuXHRcdC8vIFx0cmV0dXJuO1xyXG5cdFx0Ly8gfVxyXG5cclxuXHRcdHZhciBzdG9yZSA9IHN0b3JlU2VydmljZS5jdXJyZW50O1xyXG5cdFx0aWYoc3RvcmUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cclxuXHRcdHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmV0KXtcclxuXHRcdFx0JHN0YXRlLmdvKHRvU3RhdGUsIHRvUGFyYW1zKTtcclxuXHJcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xyXG5cdFx0XHRlcnJvclNlcnZpY2UubGFzdEVycm9yID0gZXJyO1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2Vycm9yJyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBzZWN1cml0eVNlcnZpY2UucmVxdWVzdEN1cnJlbnRVc2VyKClcclxuXHRcdC8vIFx0LnRoZW4oZnVuY3Rpb24odSkge1xyXG5cclxuXHRcdC8vIFx0XHR2YXIgdGFyZ2V0U3RhdGUgPSB1ID8gdG9TdGF0ZSA6ICdsb2dpbic7XHJcblxyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbyh0YXJnZXRTdGF0ZSk7XHJcblx0XHQvLyBcdH0pLmNhdGNoKGZ1bmN0aW9uKGV4KSB7XHJcblx0XHQvLyBcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xyXG5cdFx0Ly8gXHR9KTtcclxuXHR9KTtcclxuXHJcblx0dmFyIHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG5cdFx0XHJcblx0XHRpZighJHJvb3RTY29wZS5zaG93U3BsYXNoKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0d2FpdGluZ0ZvclZpZXcgPSB0cnVlO1xyXG5cdH0pO1xyXG5cclxuXHQkcm9vdFNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oZSkge1xyXG5cclxuXHJcblx0XHRpZiAod2FpdGluZ0ZvclZpZXcgJiYgJHJvb3RTY29wZS5zaG93U3BsYXNoKSB7XHJcblx0XHRcdHdhaXRpbmdGb3JWaWV3ID0gZmFsc2U7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnZ2l2ZSB0aW1lIHRvIHJlbmRlcicpO1xyXG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2hvd1NwbGFzaCA9IGZhbHNlJyk7XHJcblx0XHRcdFx0JHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblx0XHRcdH0sIDEwKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignSGVhZGVyQ29udHJvbGxlcicsIEhlYWRlckNvbnRyb2xsZXIpO1xyXG5cclxuZnVuY3Rpb24gSGVhZGVyQ29udHJvbGxlcihzdG9yZVNlcnZpY2UsIHNvY2tldCwgJHN0YXRlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuXHRcdG5vdGlmaWNhdGlvbnM6IFtdXHJcblx0fSk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cclxuXHRcdHZhciBub3RpZmljYXRpb24gPSB7XHJcblx0XHRcdG5hbWU6ICdtZXNzYWdlJyxcclxuXHRcdFx0ZGF0YTogZGF0YSxcclxuXHRcdFx0Z286IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JHN0YXRlLmdvKCdjaGF0KHtpZDogZGF0YS5jaGF0fSknKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0dm0ubm90aWZpY2F0aW9ucy51bnNoaWZ0KG5vdGlmaWNhdGlvbik7XHJcblxyXG5cdH0pO1xyXG5cclxuXHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3MpIHtcclxuXHRcdHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHBcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0SGVscCgpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnaGVscC1yZXF1ZXN0ZWQnLCB7c3RvcmVfaWQ6IHN0b3JlU2VydmljZS5jdXJyZW50Ll9pZH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG4gICAgICAgIHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuICAgIH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdlcnJvcicsIHtcclxuXHRcdHVybDogJy9lcnJvcicsXHJcblx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFcnJvcnNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Vycm9ycy9lcnJvci5odG1sJ1xyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbnRyb2xsZXIoJ0Vycm9yQ29udHJvbGxlcicsIEVycm9yQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JDb250cm9sbGVyKGVycm9yU2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlcnJvcjogZXJyb3JTZXJ2aWNlLmxhc3RFcnJvclxyXG5cdH0pO1xyXG5cclxuJHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcbi5mYWN0b3J5KCdlcnJvclNlcnZpY2UnLCBFcnJvclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yU2VydmljZSgpe1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGxhc3RFcnJvcjogbnVsbFxyXG5cdH07XHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsICRzdGF0ZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlTmV3Q2hhdCgpe1xyXG5cclxuXHRcdGNoYXRTZXJ2aWNlLmNyZWF0ZSgpXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcpXHJcblx0XHQvLyAudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0Ly8gXHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IHJlcy5kYXRhLl9pZH0pO1xyXG5cdFx0Ly8gfSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcblxyXG5cdHJldHVybiBkYXRhLm1hcChmdW5jdGlvbih4KSB7XHJcblx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHQvLyBjb3B5IHJhdyBwcm9wZXJ0aWVzXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XHJcblxyXG5cdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHR2YXIgb3RoZXJzID0gW107XHJcblxyXG5cdGRhdGEucGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xyXG5cdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0b3RoZXJzLnB1c2goeC5maXJzdE5hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnVzZXJzID0gb3RoZXJzLmpvaW4oJywgJyk7XHJcblxyXG5cdHRoaXMubGFzdE1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2VzLnNsaWNlKC0xKVswXTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQsIHN0b3JlU2VydmljZSkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHRcdGNyZWF0ZTogX2NyZWF0ZUNoYXRcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge21lc3NhZ2U6IG1lc3NhZ2V9KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlQ2hhdChvcHRzKXtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcsIG9wdHMpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhKTtcclxuXHRcdFx0JHJvb3RTY29wZS4kZW1pdCgnY2hhdC1tZXNzYWdlJywgZGF0YSk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0SWQsIGh0dHBDbGllbnQsICRyb290U2NvcGUsIGNoYXRTZXJ2aWNlKSB7XHJcblxyXG5cdFx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0XHRjaGF0OiBudWxsLFxyXG5cdFx0XHRzZW5kOiBzZW5kTWVzc2FnZSxcclxuXHRcdFx0bWVzc2FnZTogJycsXHJcblx0XHRcdHByb2R1Y3Q6IG51bGxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgY2hhdElkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0ID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpIHtcclxuXHRcdFx0dm0uY2hhdC5tZXNzYWdlcy5wdXNoKG1zZyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuXHRcdFx0dmFyIG1lc3NhZ2UgPSB2bS5tZXNzYWdlO1xyXG5cdFx0XHR2bS5tZXNzYWdlID0gJyc7XHJcblxyXG5cdFx0XHRjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0SWQsIG1lc3NhZ2UpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe1xyXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBtc2cubWVzc2FnZSxcclxuXHRcdFx0XHRcdFx0dGltZTogbXNnLnRpbWUsXHJcblx0XHRcdFx0XHRcdHVzZXI6IG1zZy51c2VyLFxyXG5cdFx0XHRcdFx0XHRzZW50OiB0cnVlXHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmZhY3RvcnkoJ3N0b3JlU2VydmljZScsIFN0b3JlU2VydmljZSk7XHJcblxyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIFN0b3JlU2VydmljZShnZW9Mb2NhdGlvbiwgaHR0cENsaWVudCwgJHJvb3RTY29wZSwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgdmFyIGF2YWlsYWJsZUV2ZW50cyA9IFsnc3RvcmVDaGFuZ2VkJ107XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgZ2V0QnlJZDogX2dldEJ5SWQsXHJcbiAgICAgICAgZ2V0Q3VycmVudFN0b3JlOiBfZ2V0Q3VycmVudFN0b3JlLFxyXG4gICAgICAgIG9uOiBfcmVnaXN0ZXJMaXN0ZW5lclxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnQnLCB7XHJcbiAgICAgICAgZ2V0OiBfZ2V0X2N1cnJlbnQsXHJcbiAgICAgICAgc2V0OiBfc2V0X2N1cnJlbnQsXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gX2dldF9jdXJyZW50KCl7XHJcbiAgICAgICAgcmV0dXJuIF9jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gX3NldF9jdXJyZW50KHZhbHVlKXtcclxuICAgICAgICBfY3VycmVudCA9IHZhbHVlO1xyXG4gICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtzdG9yZTogX2N1cnJlbnR9KTsgICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9nZXRCeUlkKGlkKXtcclxuICAgICAgICByZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIGlkKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcyl7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfZ2V0Q3VycmVudFN0b3JlKCkge1xyXG5cclxuICAgICAgICB2YXIgc3RvcmVkU3RvcmUgPSBzdG9yYWdlU2VydmljZS5nZXQoJ3N0b3JlJyk7XHJcbiAgICAgICAgaWYoc3RvcmVkU3RvcmUpe1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF9nZXRCeUlkKHN0b3JlZFN0b3JlKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihzdG9yZSl7XHJcbiAgICAgICAgICAgICAgICBfY3VycmVudCA9IHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnc3RvcmVDaGFuZ2VkJywge3N0b3JlOiBfY3VycmVudH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZW9Mb2NhdGlvbi5nZXRHcHMoKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZ3BzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsYXQ6IGdwcy5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbG5nOiBncHMuY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cENsaWVudC5nZXQoJy9sb2NhdGlvbnMnLCB7IHBhcmFtczogcGFyYW1zIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY3VycmVudCA9IHJlc3BvbnNlLmRhdGFbMF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnc3RvcmVDaGFuZ2VkJywge3N0b3JlOiBfY3VycmVudH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfY3VycmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3JlZ2lzdGVyTGlzdGVuZXIobmFtZSwgaGFuZGxlcil7XHJcblxyXG4gICAgICAgIGlmKGF2YWlsYWJsZUV2ZW50cy5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZXZlbnQgXFwnJyArIG5hbWUgKydcXCcgaXMgbm90IGF2YWlsYWJsZSBvbiBzdG9yZVNlcnZpY2UuJyk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKG5hbWUsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzb2NrZXRCdWlsZGVyJywgZnVuY3Rpb24gKHNvY2tldEZhY3RvcnksIGVudiwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcbiAgICAgICAgdmFyIGJ1aWxkZXIgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAgICAgICAgIGlmKG5hbWVzcGFjZSlcclxuICAgICAgICAgICAgICAgIHVyaSArPSBuYW1lc3BhY2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGV2aWNlSWQgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KHVyaSwge1xyXG4gICAgICAgICAgICAgICAgcXVlcnk6ICdkZXZpY2U9JyArIGRldmljZUlkXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gYnVpbGRlcjtcclxuXHJcbiAgICB9KVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpIHtcclxuICAgICAgICByZXR1cm4gc29ja2V0QnVpbGRlcigpO1xyXG4gICAgfSk7XHJcbiAgICAiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uZmFjdG9yeSgnbm90aWZpY2F0aW9uU2VydmljZScsIE5vdGlmaWNhdGlvblNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIE5vdGlmaWNhdGlvblNlcnZpY2UoJHJvb3RTY29wZSwgc29ja2V0QnVpbGRlcil7XHJcblxyXG5cdHZhciBzb2NrZXQgPSBzb2NrZXRCdWlsZGVyKCcnKTtcclxuXHJcblx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0Ly9cdCRyb290U2NvcGVcclxuXHR9KTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uZmFjdG9yeSgnZ2VvTG9jYXRpb24nLCBHZW9Mb2NhdGlvblNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEdlb0xvY2F0aW9uU2VydmljZSgkcSwgJHdpbmRvdywgJHJvb3RTY29wZSkge1xyXG5cclxuICAgIHZhciB3YXRjaGVyQ291bnQgPSAwO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0R3BzOiBfY3VycmVudFBvc2l0aW9uLFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gX2N1cnJlbnRQb3NpdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkd2luZG93Lm5hdmlnYXRvci5nZW9sb2NhdGlvbilcclxuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCgnR1BTIGlzIG5vdCBhdmFpbGFibGUgb24geW91ciBkZXZpY2UuJyk7XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcbiAgICAgICAgJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGZ1bmN0aW9uIChwb3MpIHtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkgeyBkZWZlci5yZXNvbHZlKHBvcyk7IH0pO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChleCkge1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXguY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGRlZmVyLnJlamVjdCgnUGVybWlzc2lvbiBEZW5pZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBkZWZlci5yZWplY3QoJ1Bvc2l0aW9uIFVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVmZXIucmVqZWN0KCdUaW1lb3V0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGRlZmVyLnJlamVjdCgnVW5rb3duJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbi5pbnRlcmNlcHRvcnMnLCBbXSlcclxuXHQuZmFjdG9yeSgnZGV2aWNlSW50ZXJjZXB0b3InLCBEZXZpY2VJbnRlcmNlcHRvcilcclxuICAgIC5jb25maWcoYWRkSW50ZXJjZXB0b3JzKTtcclxuXHJcbmZ1bmN0aW9uIERldmljZUludGVyY2VwdG9yKCRxLCBzdG9yYWdlU2VydmljZSl7XHJcblx0cmV0dXJuIHtcclxuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpe1xyXG5cclxuICAgICAgICAgICAgaWYoIWNvbmZpZyB8fCAhY29uZmlnLmhlYWRlcnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG5cclxuICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbJ3gtZGV2aWNlJ10gPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEludGVyY2VwdG9ycygkaHR0cFByb3ZpZGVyKXtcclxuXHQkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdkZXZpY2VJbnRlcmNlcHRvcicpO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmRpcmVjdGl2ZSgncWFTZXRTdG9yZUNsYXNzJywgc2V0U3RvcmVDbGFzcyk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gc2V0U3RvcmVDbGFzcyhzdG9yZVNlcnZpY2Upe1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0bGluazogX2xpbmtGblxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2xpbmtGbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG5cclxuXHRcdHN0b3JlU2VydmljZS5vbignc3RvcmVDaGFuZ2VkJywgZnVuY3Rpb24oZSwgYXJncyl7XHJcblx0XHRcdC8vYXR0cnMuaWQgPSBhcmdzLnN0b3JlLm9yZ2FuaXphdGlvbi5hbGlhcztcclxuXHRcdFx0ZWxlbWVudC5hdHRyKFwiaWRcIiwgYXJncy5zdG9yZS5vcmdhbml6YXRpb24uYWxpYXMpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbmZpZyhfY29uZmlndXJlSHR0cCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gX2NvbmZpZ3VyZUh0dHAoaHR0cENsaWVudFByb3ZpZGVyLCBlbnYpIHtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAvL2h0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5OYW1lID0gXCJ0b2tlblwiO1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuVHlwZSA9IFwiQmVhcmVyXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29uc3RhbnQoJ2VudicsIHtcclxuICAgIGFwaVJvb3Q6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==