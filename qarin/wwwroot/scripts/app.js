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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFyZWFzL3RlbXAvb3V0c2lkZXNoZWxsLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9wcm9kdWN0cy9wcm9kdWN0cy5tb2R1bGUuanMiLCJhcmVhcy9wcm9kdWN0cy9zZWFyY2guY29udHJvbGxlci5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3Quc2VydmljZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3QuY29udHJvbGxlci5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbG9jYXRvci5jb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xheW91dC5jb25maWcuanMiLCJhcmVhcy9sYXlvdXQvaGVhZGVyLmNvbnRyb2xsZXIuanMiLCJhcmVhcy9ob21lL2hvbWUubW9kdWxlLmpzIiwiYXJlYXMvaG9tZS9ob21lLnJvdXRlcy5qcyIsImFyZWFzL2hvbWUvSG9tZUNvbnRyb2xsZXIuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLm1vZHVsZS5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMucm91dGVzLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5jb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9yLnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L2NoYXRsaXN0LmNvbnRyb2xsZXIuanMiLCJhcmVhcy9jaGF0L2NoYXQuc2VydmljZS5qcyIsImFyZWFzL2NoYXQvQ2hhdENvbnRyb2xsZXIuanMiLCJzZXJ2aWNlcy9zdG9yZVNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zb2NrZXRzLmpzIiwic2VydmljZXMvbm90aWZpY2F0aW9uLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9nZW9Mb2NhdGlvblNlcnZpY2UuanMiLCJzZXJ2aWNlcy9kZXZpY2VJbnRlcmNlcHRvci5qcyIsImRpcmVjdGl2ZXMvcWFTZXRTdG9yZUNsYXNzLmRpcmVjdGl2ZS5qcyIsImNvbmZpZy9odHRwLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJzdGF0ZSIsInVybCIsImFic3RyYWN0Iiwidmlld3MiLCJ0ZW1wbGF0ZVVybCIsInBhcmVudCIsInRlbXBsYXRlIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInJlc29sdmUiLCJjaGF0SWQiLCIkc3RhdGVQYXJhbXMiLCJpZCIsInJ1biIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkb24iLCJldmVudCIsInVuZm91bmRTdGF0ZSIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJ0b1BhcmFtcyIsIm9wdGlvbnMiLCJPdXRzaWRlU2hlbGxDb250cm9sbGVyIiwic3RvcmVTZXJ2aWNlIiwic3RvcmFnZVNlcnZpY2UiLCJub2RlIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiYm9keSIsImFwcGVuZENoaWxkIiwid2luZG93IiwiYWRkU3R5bGVTdHJpbmciLCJzdHIiLCJpbm5lckhUTUwiLCJ2bSIsImV4dGVuZCIsInNldFN0b3JlIiwiX3NldFN0b3JlIiwic2V0U3RvcmVVc2luZ0xvY2F0aW9uIiwiX3NldFN0b3JlVXNpbmdMb2NhdGlvbiIsImdldEJ5SWQiLCJ0aGVuIiwic3RvcmUiLCJjdXJyZW50Iiwic2V0IiwiZ28iLCJyZW1vdmUiLCJnZXRDdXJyZW50U3RvcmUiLCJTZWFyY2hDb250cm9sbGVyIiwiaHR0cENsaWVudCIsInF1ZXJ5IiwiJGxvY2F0aW9uIiwicHJvZHVjdHMiLCJzZWFyY2giLCJfc2VhcmNoIiwiX2luaXQiLCJnZXQiLCJyZXMiLCJkYXRhIiwicmVsb2FkIiwicmVnaXN0ZXJSb3V0ZXMiLCJwcm9kdWN0IiwicHJvZHVjdFNlcnZpY2UiLCJwcm9kdWN0SWQiLCJmYWN0b3J5IiwiUHJvZHVjdFNlcnZpY2UiLCJzZXJ2aWNlIiwiX2dldFByb2R1Y3RCeUlkIiwiUHJvZHVjdENvbnRyb2xsZXIiLCJjaGF0U2VydmljZSIsImNyZWF0ZUNoYXQiLCJfY3JlYXRlQ2hhdCIsImNyZWF0ZSIsIl9pZCIsImNoYXQiLCJjYXRjaCIsImV4IiwiJHNjb3BlIiwic29ja2V0Iiwib24iLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJlIiwidG9TdGF0ZSIsInByZXZlbnREZWZhdWx0IiwicmV0IiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbiIsIm5hbWUiLCJ1bnNoaWZ0IiwiYXJncyIsImNvbmZpZ3VyZVJvdXRlcyIsIkhvbWVDb250cm9sbGVyIiwiJGh0dHAiLCJlbnYiLCJyZXF1ZXN0SGVscCIsIl9yZXF1ZXN0SGVscCIsImVtaXQiLCJzdG9yZV9pZCIsIkVycm9yQ29udHJvbGxlciIsImVycm9yIiwiRXJyb3JTZXJ2aWNlIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiY2hhdHMiLCJfY3JlYXRlTmV3Q2hhdCIsIm9wdHMiLCJwYXJhbXMiLCJwYXJzZSIsIm1hcCIsIngiLCJDaGF0IiwibXlEZXZpY2VJZCIsIm90aGVycyIsInBhcnRpY2lwYW50cyIsImZvckVhY2giLCJkZXZpY2UiLCJwdXNoIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJqb2luIiwibGFzdE1lc3NhZ2UiLCJtZXNzYWdlcyIsInNsaWNlIiwiQ2hhdEZhY3RvcnkiLCJzZW5kTWVzc2FnZSIsImluaXQiLCJtZXNzYWdlIiwicG9zdCIsIiRlbWl0Iiwic2VuZCIsIm1zZyIsInRpbWUiLCJ1c2VyIiwic2VudCIsIlN0b3JlU2VydmljZSIsImdlb0xvY2F0aW9uIiwiX2N1cnJlbnQiLCJhdmFpbGFibGVFdmVudHMiLCJfZ2V0QnlJZCIsIl9nZXRDdXJyZW50U3RvcmUiLCJfcmVnaXN0ZXJMaXN0ZW5lciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiX2dldF9jdXJyZW50IiwiX3NldF9jdXJyZW50IiwiZW51bWVyYWJsZSIsInZhbHVlIiwic3RvcmVkU3RvcmUiLCJnZXRHcHMiLCJncHMiLCJsYXQiLCJjb29yZHMiLCJsYXRpdHVkZSIsImxuZyIsImxvbmdpdHVkZSIsInJlc3BvbnNlIiwibGVuZ3RoIiwiaGFuZGxlciIsImluZGV4T2YiLCJFcnJvciIsInNvY2tldEZhY3RvcnkiLCJidWlsZGVyIiwibmFtZXNwYWNlIiwidXJpIiwiYXBpUm9vdCIsImRldmljZUlkIiwibXlJb1NvY2tldCIsImlvIiwiY29ubmVjdCIsIm15U29ja2V0IiwiaW9Tb2NrZXQiLCJzb2NrZXRCdWlsZGVyIiwiTm90aWZpY2F0aW9uU2VydmljZSIsIkdlb0xvY2F0aW9uU2VydmljZSIsIiRxIiwiJHdpbmRvdyIsIndhdGNoZXJDb3VudCIsIl9jdXJyZW50UG9zaXRpb24iLCJuYXZpZ2F0b3IiLCJnZW9sb2NhdGlvbiIsInJlamVjdCIsImRlZmVyIiwiZ2V0Q3VycmVudFBvc2l0aW9uIiwicG9zIiwiJGFwcGx5IiwiY29kZSIsInByb21pc2UiLCJEZXZpY2VJbnRlcmNlcHRvciIsImFkZEludGVyY2VwdG9ycyIsInJlcXVlc3QiLCJoZWFkZXJzIiwiaW50ZXJjZXB0b3JzIiwiZGlyZWN0aXZlIiwic2V0U3RvcmVDbGFzcyIsImxpbmsiLCJfbGlua0ZuIiwic2NvcGUiLCJlbGVtZW50IiwiYXR0cnMiLCJhdHRyIiwib3JnYW5pemF0aW9uIiwiYWxpYXMiLCJfY29uZmlndXJlSHR0cCIsImh0dHBDbGllbnRQcm92aWRlciIsImJhc2VVcmkiLCJjb25zdGFudCJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxZQUFZO0lBQ1Q7SUFBSkEsUUFBUUMsT0FBTyxTQUFTO1FBQ3BCO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFFQTtRQUNB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LGVBQWVDLG9CQUFvQjdHLEtBQUs7UUFDN0M2RyxtQkFBbUJDLFVBQVU5RyxJQUFJc0U7Ozs7S0FHaEM7QUNSTCxDQUFDLFlBQVk7SUFDVDtJQURKdEwsUUFBUUMsT0FBTyxTQUNkOE4sU0FBUyxPQUFPLEVBQ2J6QyxTQUFTO0tBQ1IiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbicsIFsgICAgXHJcbiAgICAnc3ltYmlvdGUuY29tbW9uJyxcclxuICAgICdxYXJpbi5wYXJ0aWFscycsXHJcbiAgICAndWkucm91dGVyJyxcclxuICAgICduZ0FuaW1hdGUnLFxyXG4gICAgJ2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cclxuICAgICdxYXJpbi5pbnRlcmNlcHRvcnMnLFxyXG4gICAgJ3FhcmluLmVycm9ycycsXHJcbiAgICBcclxuICAgICdxYXJpbi5ob21lJyxcclxuICAgICdxYXJpbi5wcm9kdWN0cydcclxuXHJcbiAgICBdKVxyXG5cclxuXHJcbi5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAgIFxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld3M6IHtcclxuICAgICAgICAgICAgICAgICcnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb250cm9sbGVyOiAnUm9vdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xheW91dC9sYXlvdXQuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICxcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmaWNhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb250cm9sbGVyOiAnTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9ucy5odG1sJ1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2xheW91dCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzx1aS12aWV3PjwvdWktdmlldz4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICAuc3RhdGUoJ2NoYXQtbGlzdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdsYXlvdXQnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXRsaXN0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdExpc3RDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2NoYXQnLCB7XHJcbiAgICAgICAgICAgIHVybDogJy9jaGF0LzppZCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdC5odG1sJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NoYXRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICAgICAgICBjaGF0SWQ6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzdGF0ZVBhcmFtcy5pZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59KTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsICRzdGF0ZSkge1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUudG8pOyAvLyBcImxhenkuc3RhdGVcIlxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50b1BhcmFtcyk7IC8vIHthOjEsIGI6Mn1cclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUub3B0aW9ucyk7IC8vIHtpbmhlcml0OmZhbHNlfSArIGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdPdXRzaWRlU2hlbGxDb250cm9sbGVyJywgT3V0c2lkZVNoZWxsQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBPdXRzaWRlU2hlbGxDb250cm9sbGVyKHN0b3JlU2VydmljZSwgc3RvcmFnZVNlcnZpY2UsICRzdGF0ZSkge1xyXG5cclxuXHR2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcclxuXHR3aW5kb3cuYWRkU3R5bGVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcclxuXHRcdG5vZGUuaW5uZXJIVE1MID0gc3RyO1xyXG5cdH1cclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0c2V0U3RvcmU6IF9zZXRTdG9yZSxcclxuXHRcdHNldFN0b3JlVXNpbmdMb2NhdGlvbjogX3NldFN0b3JlVXNpbmdMb2NhdGlvbixcclxuXHR9KTtcclxuXHJcblx0ZnVuY3Rpb24gX3NldFN0b3JlKGlkKSB7XHRcdFxyXG5cdFx0cmV0dXJuIHN0b3JlU2VydmljZS5nZXRCeUlkKGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihzdG9yZSkge1xyXG5cdFx0XHRcdHN0b3JlU2VydmljZS5jdXJyZW50ID0gc3RvcmU7XHJcblx0XHRcdFx0c3RvcmFnZVNlcnZpY2Uuc2V0KCdzdG9yZScsIGlkLCB0cnVlKTtcclxuXHJcblx0XHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XHJcblxyXG5cdFx0XHRcdHJldHVybiBzdG9yZTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfc2V0U3RvcmVVc2luZ0xvY2F0aW9uKCkge1xyXG5cdFx0XHJcblx0XHRzdG9yYWdlU2VydmljZS5yZW1vdmUoJ3N0b3JlJyk7XHJcblx0XHRyZXR1cm4gc3RvcmVTZXJ2aWNlLmdldEN1cnJlbnRTdG9yZSgpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHN0b3JlKSB7XHJcblxyXG5cdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gc3RvcmU7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycsIFsndWkucm91dGVyJ10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcbi5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgU2VhcmNoQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gU2VhcmNoQ29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UsIHF1ZXJ5LCAkc3RhdGUsICRsb2NhdGlvbil7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHByb2R1Y3RzOiBbXSxcclxuXHRcdHF1ZXJ5OiBxdWVyeSB8fCAnJyxcclxuXHRcdHNlYXJjaDogX3NlYXJjaFxyXG5cdH0pO1xyXG5cclxuXHRfaW5pdCgpO1xyXG5cclxuXHRmdW5jdGlvbiBfaW5pdCgpe1xyXG5cdFx0IGlmKCF2bS5xdWVyeSlcclxuXHRcdCBcdHJldHVybjtcclxuXHRcdC8vIFx0X3NlYXJjaCgpO1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL3Byb2R1Y3RzP3NlYXJjaD0nICsgdm0ucXVlcnk7XHJcblx0XHRodHRwQ2xpZW50LmdldCh1cmwpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHR2bS5wcm9kdWN0cyA9IHJlcy5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfc2VhcmNoKCl7XHJcblxyXG5cdFx0Ly8gdmFyIG9yaWdpbmFsVXJsID0gJGxvY2F0aW9uLnVybCgpO1xyXG5cdFx0Ly8gdmFyIHVybCA9ICRzdGF0ZS5ocmVmKCdzZWFyY2gnLCB7cXVlcnk6IHZtLnF1ZXJ5fSk7XHJcblx0XHQvLyBpZihvcmlnaW5hbFVybCAhPT0gdXJsKVxyXG5cdFx0Ly8gXHQkbG9jYXRpb24udXJsKHVybCk7XHJcblx0XHQvLyRsb2NhdGlvbi5wdXNoXHJcblx0XHQkc3RhdGUuZ28oJ3NlYXJjaCcsIHtxdWVyeTogdm0ucXVlcnl9LCB7cmVsb2FkOiB0cnVlfSk7XHJcblx0XHRcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5jb25maWcocmVnaXN0ZXJSb3V0ZXMpXHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gcmVnaXN0ZXJSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XHJcblx0XHR1cmw6ICcvc2VhcmNoP3F1ZXJ5JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL3Byb2R1Y3RzL3NlYXJjaC5odG1sJyxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0cXVlcnk6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0cmV0dXJuICRzdGF0ZVBhcmFtcy5xdWVyeTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pXHJcblx0LnN0YXRlKCdwcm9kdWN0Jywge1xyXG5cdFx0dXJsOiAnL3Byb2R1Y3QvOnByb2R1Y3RJZCcsXHJcblx0XHRjb250cm9sbGVyOiAnUHJvZHVjdENvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvcHJvZHVjdC5odG1sJyxcclxuXHRcdHJlc29sdmU6IHtcclxuXHRcdFx0cHJvZHVjdDogZnVuY3Rpb24ocHJvZHVjdFNlcnZpY2UsICRzdGF0ZVBhcmFtcyl7XHJcblx0XHRcdFx0cmV0dXJuIHByb2R1Y3RTZXJ2aWNlLmdldCgkc3RhdGVQYXJhbXMucHJvZHVjdElkKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuXHQuZmFjdG9yeSgncHJvZHVjdFNlcnZpY2UnLCBQcm9kdWN0U2VydmljZSk7XHJcblxyXG5mdW5jdGlvbiBQcm9kdWN0U2VydmljZShodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRnZXQ6IF9nZXRQcm9kdWN0QnlJZFxyXG5cdH07XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBfZ2V0UHJvZHVjdEJ5SWQoaWQpIHtcclxuXHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5nZXQoJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9wcm9kdWN0cy8nICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLnByb2R1Y3RzJylcclxuLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgUHJvZHVjdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFByb2R1Y3RDb250cm9sbGVyKHByb2R1Y3RTZXJ2aWNlLCBwcm9kdWN0LCAkc3RhdGUsIGNoYXRTZXJ2aWNlKXtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0cHJvZHVjdDogcHJvZHVjdCxcclxuXHRcdGNyZWF0ZUNoYXQ6IF9jcmVhdGVDaGF0XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIF9jcmVhdGVDaGF0KCl7XHJcblxyXG5cdFx0Y2hhdFNlcnZpY2UuY3JlYXRlKHtwcm9kdWN0OiBwcm9kdWN0Ll9pZH0pXHJcblx0XHQudGhlbihmdW5jdGlvbihjaGF0KXtcclxuXHRcdFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiBjaGF0Ll9pZH0pO1xyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXgpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhleCk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29udHJvbGxlcignTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBzb2NrZXQpIHtcclxuXHJcbiAgICAkc2NvcGUuY3VycmVudCA9IHt9O1xyXG4gICAgLy9ub3RpZmljYXRpb25Tb2NrZXRcclxuICAgIHNvY2tldC5vbignaGVscCcsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmN1cnJlbnQgPSBkYXRhO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc29ja2V0Lm9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHJcbiAgICB9KTtcclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5jb250cm9sbGVyKCdMb2NhdG9yQ29udHJvbGxlcicsIExvY2F0b3JDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBMb2NhdG9yQ29udHJvbGxlcigkc2NvcGUsIHN0b3JlU2VydmljZSkge1xyXG5cclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5ydW4oZW5zdXJlQXV0aGVudGljYXRlZCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZW5zdXJlQXV0aGVudGljYXRlZCgkcm9vdFNjb3BlLCAkc3RhdGUsICR0aW1lb3V0LCBzdG9yZVNlcnZpY2UsIGVycm9yU2VydmljZSkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHQvLyBpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHQvLyBcdHJldHVybjtcclxuXHRcdC8vIH1cclxuXHJcblx0XHR2YXIgc3RvcmUgPSBzdG9yZVNlcnZpY2UuY3VycmVudDtcclxuXHRcdGlmKHN0b3JlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHJcblx0XHRzdG9yZVNlcnZpY2UuZ2V0Q3VycmVudFN0b3JlKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdCRzdGF0ZS5nbyh0b1N0YXRlLCB0b1BhcmFtcyk7XHJcblxyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcclxuXHRcdFx0ZXJyb3JTZXJ2aWNlLmxhc3RFcnJvciA9IGVycjtcclxuXHRcdFx0JHN0YXRlLmdvKCdlcnJvcicpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHQvLyBcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcblx0XHQvLyBcdFx0dmFyIHRhcmdldFN0YXRlID0gdSA/IHRvU3RhdGUgOiAnbG9naW4nO1xyXG5cclxuXHRcdC8vIFx0XHQkc3RhdGUuZ28odGFyZ2V0U3RhdGUpO1xyXG5cdFx0Ly8gXHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdC8vIFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHZhciB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHRcdFxyXG5cdFx0aWYoISRyb290U2NvcGUuc2hvd1NwbGFzaClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHdhaXRpbmdGb3JWaWV3ID0gdHJ1ZTtcclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcclxuXHJcblxyXG5cdFx0aWYgKHdhaXRpbmdGb3JWaWV3ICYmICRyb290U2NvcGUuc2hvd1NwbGFzaCkge1xyXG5cdFx0XHR3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3Nob3dTcGxhc2ggPSBmYWxzZScpO1xyXG5cdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHR9LCAxMCk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ0hlYWRlckNvbnRyb2xsZXInLCBIZWFkZXJDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhlYWRlckNvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlLCBzb2NrZXQsICRzdGF0ZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRzdG9yZTogc3RvcmVTZXJ2aWNlLmN1cnJlbnQsXHJcblx0XHRub3RpZmljYXRpb25zOiBbXVxyXG5cdH0pO1xyXG5cclxuXHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHJcblx0XHR2YXIgbm90aWZpY2F0aW9uID0ge1xyXG5cdFx0XHRuYW1lOiAnbWVzc2FnZScsXHJcblx0XHRcdGRhdGE6IGRhdGEsXHJcblx0XHRcdGdvOiBmdW5jdGlvbigpe1xyXG5cdFx0XHRcdCRzdGF0ZS5nbygnY2hhdCh7aWQ6IGRhdGEuY2hhdH0pJyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHZtLm5vdGlmaWNhdGlvbnMudW5zaGlmdChub3RpZmljYXRpb24pO1xyXG5cclxuXHR9KTtcclxuXHJcblx0c3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKSB7XHJcblx0XHR2bS5zdG9yZSA9IGFyZ3Muc3RvcmU7XHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uaG9tZScsIFsndWkucm91dGVyJ10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKCRzdGF0ZVByb3ZpZGVyKSB7XHJcblxyXG5cdCRzdGF0ZVByb3ZpZGVyXHJcblx0XHQuc3RhdGUoJ2hvbWUnLCB7XHJcblx0XHRcdHVybDogJy8nLFxyXG5cdFx0XHRwYXJlbnQ6ICdsYXlvdXQnLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9ob21lL2hvbWUuaHRtbCcsXHJcblx0XHRcdGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXHJcblx0XHRcdGNvbnRyb2xsZXJBczogJ3ZtJ1xyXG5cdFx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uaG9tZScpXHJcbiAgICAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBIb21lQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBIb21lQ29udHJvbGxlcigkc2NvcGUsICRodHRwLCBlbnYsIHNvY2tldCwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgdmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG4gICAgICAgIHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudCxcclxuICAgICAgICByZXF1ZXN0SGVscDogX3JlcXVlc3RIZWxwXHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBfcmVxdWVzdEhlbHAoKSB7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoJ2hlbHAtcmVxdWVzdGVkJywge3N0b3JlX2lkOiBzdG9yZVNlcnZpY2UuY3VycmVudC5faWR9KTtcclxuICAgIH07XHJcblxyXG4gICAgc3RvcmVTZXJ2aWNlLm9uKCdzdG9yZUNoYW5nZWQnLCBmdW5jdGlvbihlLCBhcmdzKXtcclxuICAgICAgICB2bS5zdG9yZSA9IGFyZ3Muc3RvcmU7XHJcbiAgICB9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbmZpZyhjb25maWd1cmVSb3V0ZXMpO1xyXG5cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKCRzdGF0ZVByb3ZpZGVyKXtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnZXJyb3InLCB7XHJcblx0XHR1cmw6ICcvZXJyb3InLFxyXG5cdFx0cGFyZW50OiAncm9vdCcsXHJcblx0XHRjb250cm9sbGVyOiAnRXJyb3JzQ29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9lcnJvcnMvZXJyb3IuaHRtbCdcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG5cdC5jb250cm9sbGVyKCdFcnJvckNvbnRyb2xsZXInLCBFcnJvckNvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yQ29udHJvbGxlcihlcnJvclNlcnZpY2UsICRyb290U2NvcGUpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZXJyb3I6IGVycm9yU2VydmljZS5sYXN0RXJyb3JcclxuXHR9KTtcclxuXHJcbiRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG4uZmFjdG9yeSgnZXJyb3JTZXJ2aWNlJywgRXJyb3JTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBFcnJvclNlcnZpY2UoKXtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRsYXN0RXJyb3I6IG51bGxcclxuXHR9O1xyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignQ2hhdExpc3RDb250cm9sbGVyJywgQ2hhdExpc3RDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBDaGF0TGlzdENvbnRyb2xsZXIoaHR0cENsaWVudCwgc3RvcmVTZXJ2aWNlLCAkc3RhdGUsIGNoYXRTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGNoYXRzOiBudWxsLFxyXG5cdFx0Y3JlYXRlOiBfY3JlYXRlTmV3Q2hhdFxyXG5cdH0pO1xyXG5cclxuXHRfaW5pdCgpO1xyXG5cclxuXHRmdW5jdGlvbiBfaW5pdCgpIHtcclxuXHRcdHZhciBvcHRzID0ge1xyXG5cdFx0XHRwYXJhbXM6IHtcclxuXHRcdFx0XHRzdG9yZTogc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWRcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL3VzZXJzL21lL2NoYXRzJywgb3B0cylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uY2hhdHMgPSBwYXJzZShyZXMuZGF0YSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZU5ld0NoYXQoKXtcclxuXHJcblx0XHRjaGF0U2VydmljZS5jcmVhdGUoKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY2hhdCl7XHJcblx0XHRcdCRzdGF0ZS5nbygnY2hhdCcsIHtpZDogY2hhdC5faWR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIGh0dHBDbGllbnQucG9zdCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL2NoYXQnKVxyXG5cdFx0Ly8gLnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdC8vIFx0JHN0YXRlLmdvKCdjaGF0Jywge2lkOiByZXMuZGF0YS5faWR9KTtcclxuXHRcdC8vIH0pO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2UoZGF0YSkge1xyXG5cclxuXHRyZXR1cm4gZGF0YS5tYXAoZnVuY3Rpb24oeCkge1xyXG5cdFx0cmV0dXJuIG5ldyBDaGF0KHgpO1xyXG5cdH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBDaGF0KGRhdGEpIHtcclxuXHJcblx0Ly8gY29weSByYXcgcHJvcGVydGllc1xyXG5cdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIGRhdGEpO1xyXG5cclxuXHR2YXIgbXlEZXZpY2VJZCA9ICdkZXYtMSc7XHJcblx0dmFyIG90aGVycyA9IFtdO1xyXG5cclxuXHRkYXRhLnBhcnRpY2lwYW50cy5mb3JFYWNoKGZ1bmN0aW9uKHgpIHtcclxuXHRcdGlmICh4LmRldmljZSA9PT0gbXlEZXZpY2VJZClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdG90aGVycy5wdXNoKHguZmlyc3ROYW1lKTtcclxuXHR9KTtcclxuXHJcblx0dGhpcy51c2VycyA9IG90aGVycy5qb2luKCcsICcpO1xyXG5cclxuXHR0aGlzLmxhc3RNZXNzYWdlID0gZGF0YS5tZXNzYWdlcy5zbGljZSgtMSlbMF07XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuZmFjdG9yeSgnY2hhdFNlcnZpY2UnLCBDaGF0RmFjdG9yeSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gQ2hhdEZhY3RvcnkoJHJvb3RTY29wZSwgaHR0cENsaWVudCwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRzZW5kTWVzc2FnZTogc2VuZE1lc3NhZ2UsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVDaGF0XHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoaWQsIG1lc3NhZ2UpIHtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9jaGF0LycgKyBpZCArICcvbWVzc2FnZXMnO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHttZXNzYWdlOiBtZXNzYWdlfSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2NyZWF0ZUNoYXQob3B0cyl7XHJcblxyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCgnL3N0b3Jlcy8nICsgc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWQgKyAnL2NoYXQnLCBvcHRzKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbml0KCl7XHJcblx0XHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0Y29uc29sZS5sb2coZGF0YSk7XHJcblx0XHRcdCRyb290U2NvcGUuJGVtaXQoJ2NoYXQtbWVzc2FnZScsIGRhdGEpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignQ2hhdENvbnRyb2xsZXInLCBmdW5jdGlvbihzb2NrZXQsIHN0b3JlU2VydmljZSwgY2hhdElkLCBodHRwQ2xpZW50LCAkcm9vdFNjb3BlLCBjaGF0U2VydmljZSkge1xyXG5cclxuXHRcdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdFx0Y2hhdDogbnVsbCxcclxuXHRcdFx0c2VuZDogc2VuZE1lc3NhZ2UsXHJcblx0XHRcdG1lc3NhZ2U6ICcnLFxyXG5cdFx0XHRwcm9kdWN0OiBudWxsXHJcblx0XHR9KTtcclxuXHJcblx0XHRodHRwQ2xpZW50LmdldCgnL2NoYXQvJyArIGNoYXRJZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdFx0dm0uY2hhdCA9IHJlcy5kYXRhO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHQkcm9vdFNjb3BlLiRvbignY2hhdC1tZXNzYWdlJywgZnVuY3Rpb24oZSwgbXNnKSB7XHJcblx0XHRcdHZtLmNoYXQubWVzc2FnZXMucHVzaChtc2cpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKSB7XHJcblx0XHRcdHZhciBtZXNzYWdlID0gdm0ubWVzc2FnZTtcclxuXHRcdFx0dm0ubWVzc2FnZSA9ICcnO1xyXG5cclxuXHRcdFx0Y2hhdFNlcnZpY2Uuc2VuZE1lc3NhZ2UoY2hhdElkLCBtZXNzYWdlKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKG1zZykge1xyXG5cdFx0XHRcdFx0dm0uY2hhdC5tZXNzYWdlcy5wdXNoKHtcclxuXHRcdFx0XHRcdFx0bWVzc2FnZTogbXNnLm1lc3NhZ2UsXHJcblx0XHRcdFx0XHRcdHRpbWU6IG1zZy50aW1lLFxyXG5cdFx0XHRcdFx0XHR1c2VyOiBtc2cudXNlcixcclxuXHRcdFx0XHRcdFx0c2VudDogdHJ1ZVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoZ2VvTG9jYXRpb24sIGh0dHBDbGllbnQsICRyb290U2NvcGUsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50ID0gbnVsbDtcclxuICAgIHZhciBhdmFpbGFibGVFdmVudHMgPSBbJ3N0b3JlQ2hhbmdlZCddO1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0ge1xyXG4gICAgICAgIGdldEJ5SWQ6IF9nZXRCeUlkLFxyXG4gICAgICAgIGdldEN1cnJlbnRTdG9yZTogX2dldEN1cnJlbnRTdG9yZSxcclxuICAgICAgICBvbjogX3JlZ2lzdGVyTGlzdGVuZXJcclxuICAgIH07XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNlcnZpY2UsICdjdXJyZW50Jywge1xyXG4gICAgICAgIGdldDogX2dldF9jdXJyZW50LFxyXG4gICAgICAgIHNldDogX3NldF9jdXJyZW50LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9nZXRfY3VycmVudCgpe1xyXG4gICAgICAgIHJldHVybiBfY3VycmVudDtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIF9zZXRfY3VycmVudCh2YWx1ZSl7XHJcbiAgICAgICAgX2N1cnJlbnQgPSB2YWx1ZTtcclxuICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7c3RvcmU6IF9jdXJyZW50fSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfZ2V0QnlJZChpZCl7XHJcbiAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvc3RvcmVzLycgKyBpZClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpe1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2dldEN1cnJlbnRTdG9yZSgpIHtcclxuXHJcbiAgICAgICAgdmFyIHN0b3JlZFN0b3JlID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdzdG9yZScpO1xyXG4gICAgICAgIGlmKHN0b3JlZFN0b3JlKXtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfZ2V0QnlJZChzdG9yZWRTdG9yZSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc3RvcmUpe1xyXG4gICAgICAgICAgICAgICAgX2N1cnJlbnQgPSBzdG9yZTtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtzdG9yZTogX2N1cnJlbnR9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2VvTG9jYXRpb24uZ2V0R3BzKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGdwcykge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF0OiBncHMuY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxuZzogZ3BzLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvbG9jYXRpb25zJywgeyBwYXJhbXM6IHBhcmFtcyB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPj0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2N1cnJlbnQgPSByZXNwb25zZS5kYXRhWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGVtaXQoJ3N0b3JlQ2hhbmdlZCcsIHtzdG9yZTogX2N1cnJlbnR9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2N1cnJlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZWdpc3Rlckxpc3RlbmVyKG5hbWUsIGhhbmRsZXIpe1xyXG5cclxuICAgICAgICBpZihhdmFpbGFibGVFdmVudHMuaW5kZXhPZihuYW1lKSA9PT0gLTEpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGV2ZW50IFxcJycgKyBuYW1lICsnXFwnIGlzIG5vdCBhdmFpbGFibGUgb24gc3RvcmVTZXJ2aWNlLicpO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbihuYW1lLCBoYW5kbGVyKTtcclxuICAgIH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0QnVpbGRlcicsIGZ1bmN0aW9uIChzb2NrZXRGYWN0b3J5LCBlbnYsIHN0b3JhZ2VTZXJ2aWNlKSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgICAgICAgICBpZihuYW1lc3BhY2UpXHJcbiAgICAgICAgICAgICAgICB1cmkgKz0gbmFtZXNwYWNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRldmljZUlkID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteUlvU29ja2V0ID0gaW8uY29ubmVjdCh1cmksIHtcclxuICAgICAgICAgICAgICAgIHF1ZXJ5OiAnZGV2aWNlPScgKyBkZXZpY2VJZFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBteVNvY2tldCA9IHNvY2tldEZhY3Rvcnkoe1xyXG4gICAgICAgICAgICAgICAgaW9Tb2NrZXQ6IG15SW9Tb2NrZXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbXlTb2NrZXQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXI7XHJcblxyXG4gICAgfSlcclxuICAgIC5mYWN0b3J5KCdzb2NrZXQnLCBmdW5jdGlvbihzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoKTtcclxuICAgIH0pO1xyXG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ25vdGlmaWNhdGlvblNlcnZpY2UnLCBOb3RpZmljYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBOb3RpZmljYXRpb25TZXJ2aWNlKCRyb290U2NvcGUsIHNvY2tldEJ1aWxkZXIpe1xyXG5cclxuXHR2YXIgc29ja2V0ID0gc29ja2V0QnVpbGRlcignJyk7XHJcblxyXG5cdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdC8vXHQkcm9vdFNjb3BlXHJcblx0fSk7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmZhY3RvcnkoJ2dlb0xvY2F0aW9uJywgR2VvTG9jYXRpb25TZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBHZW9Mb2NhdGlvblNlcnZpY2UoJHEsICR3aW5kb3csICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgd2F0Y2hlckNvdW50ID0gMDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldEdwczogX2N1cnJlbnRQb3NpdGlvbixcclxuICAgIH07XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAoZXgpIHtcclxuXHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGV4LmNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBkZWZlci5yZWplY3QoJ1Blcm1pc3Npb24gRGVuaWVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQb3NpdGlvbiBVbmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGRlZmVyLnJlamVjdCgnVGltZW91dCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBkZWZlci5yZWplY3QoJ1Vua293bicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBkZWZlci5wcm9taXNlO1xyXG4gICAgfVxyXG5cclxufSIsIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4uaW50ZXJjZXB0b3JzJywgW10pXHJcblx0LmZhY3RvcnkoJ2RldmljZUludGVyY2VwdG9yJywgRGV2aWNlSW50ZXJjZXB0b3IpXHJcbiAgICAuY29uZmlnKGFkZEludGVyY2VwdG9ycyk7XHJcblxyXG5mdW5jdGlvbiBEZXZpY2VJbnRlcmNlcHRvcigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG5cdHJldHVybiB7XHJcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKXtcclxuXHJcbiAgICAgICAgICAgIGlmKCFjb25maWcgfHwgIWNvbmZpZy5oZWFkZXJzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuXHJcbiAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWyd4LWRldmljZSddID0gc3RvcmFnZVNlcnZpY2UuZ2V0KCdkZXZpY2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRJbnRlcmNlcHRvcnMoJGh0dHBQcm92aWRlcil7XHJcblx0JGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnZGV2aWNlSW50ZXJjZXB0b3InKTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5kaXJlY3RpdmUoJ3FhU2V0U3RvcmVDbGFzcycsIHNldFN0b3JlQ2xhc3MpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIHNldFN0b3JlQ2xhc3Moc3RvcmVTZXJ2aWNlKXtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpbms6IF9saW5rRm5cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIF9saW5rRm4oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuXHJcblx0XHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG5cdFx0XHQvL2F0dHJzLmlkID0gYXJncy5zdG9yZS5vcmdhbml6YXRpb24uYWxpYXM7XHJcblx0XHRcdGVsZW1lbnQuYXR0cihcImlkXCIsIGFyZ3Muc3RvcmUub3JnYW5pemF0aW9uLmFsaWFzKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25maWcoX2NvbmZpZ3VyZUh0dHApO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIF9jb25maWd1cmVIdHRwKGh0dHBDbGllbnRQcm92aWRlciwgZW52KSB7XHJcbiAgICBodHRwQ2xpZW50UHJvdmlkZXIuYmFzZVVyaSA9IGVudi5hcGlSb290O1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuTmFtZSA9IFwidG9rZW5cIjtcclxuICAgIC8vaHR0cENsaWVudFByb3ZpZGVyLmF1dGhUb2tlblR5cGUgPSBcIkJlYXJlclwiO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbnN0YW50KCdlbnYnLCB7XHJcbiAgICBhcGlSb290OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJ1xyXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=