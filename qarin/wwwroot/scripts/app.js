(function () {
    'use strict';
    angular.module('qarin.products', ['ui.router']);
}());
(function () {
    'use strict';
    angular.module('qarin.products').config(registerRoutes);
    // @ngInject
    function registerRoutes($stateProvider) {
        $stateProvider.state('search', {
            url: '/search',
            controller: 'ProductsController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/products/search.html'
        });
    }
    registerRoutes.$inject = ["$stateProvider"];
}());
(function () {
    'use strict';
    angular.module('qarin.products').controller('ProductsController', ProductsController);
    // @ngInject
    function ProductsController(httpClient, storeService) {
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
    ProductsController.$inject = ["httpClient", "storeService"];
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
    }]);
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
    function HeaderController(storeService) {
        var vm = angular.extend(this, { store: storeService.current });
        storeService.on('storeChanged', function (e, args) {
            vm.store = args.store;
        });
    }
    HeaderController.$inject = ["storeService"];
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
    function ChatListController(httpClient, storeService, $state) {
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
            httpClient.post('/stores/' + storeService.current.id + '/chat').then(function (res) {
                $state.go('chat', { id: res.data._id });
            });
        }
    }
    ChatListController.$inject = ["httpClient", "storeService", "$state"];
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
    function ChatFactory($rootScope, httpClient, socket) {
        var service = { sendMessage: sendMessage };
        init();
        return service;
        function sendMessage(id, message) {
            var url = '/chat/' + id + '/messages';
            return httpClient.post(url, { message: message }).then(function (res) {
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
    ChatFactory.$inject = ["$rootScope", "httpClient", "socket"];
}());
(function () {
    'use strict';
    angular.module('qarin').controller('ChatController', ["socket", "storeService", "chatId", "httpClient", "$rootScope", "chatService", function (socket, storeService, chatId, httpClient, $rootScope, chatService) {
        var vm = angular.extend(this, {
            chat: null,
            send: sendMessage,
            message: ''
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLm1vZHVsZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLmNvbnRyb2xsZXIuanMiLCJhcHAuanMiLCJhcmVhcy9ub3RpZmljYXRpb25zL05vdGlmaWNhdGlvbnNDb250cm9sbGVyLmpzIiwiYXJlYXMvaG9tZS9ob21lLm1vZHVsZS5qcyIsImFyZWFzL2hvbWUvaG9tZS5yb3V0ZXMuanMiLCJhcmVhcy9ob21lL0hvbWVDb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xvY2F0b3IuY29udHJvbGxlci5qcyIsImFyZWFzL2xheW91dC9sYXlvdXQuY29uZmlnLmpzIiwiYXJlYXMvbGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5tb2R1bGUuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLnJvdXRlcy5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMuY29udHJvbGxlci5qcyIsImFyZWFzL2Vycm9ycy9lcnJvci5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9jaGF0bGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L0NoYXRDb250cm9sbGVyLmpzIiwic2VydmljZXMvc3RvcmVTZXJ2aWNlLmpzIiwic2VydmljZXMvc29ja2V0cy5qcyIsInNlcnZpY2VzL25vdGlmaWNhdGlvbi5zZXJ2aWNlLmpzIiwic2VydmljZXMvZ2VvTG9jYXRpb25TZXJ2aWNlLmpzIiwic2VydmljZXMvZGV2aWNlSW50ZXJjZXB0b3IuanMiLCJjb25maWcvaHR0cC5qcyIsImNvbmZpZy9lbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwicmVnaXN0ZXJSb3V0ZXMiLCIkc3RhdGVQcm92aWRlciIsInN0YXRlIiwidXJsIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwiUHJvZHVjdHNDb250cm9sbGVyIiwiaHR0cENsaWVudCIsInN0b3JlU2VydmljZSIsInZtIiwiZXh0ZW5kIiwicHJvZHVjdHMiLCJxdWVyeSIsInNlYXJjaCIsIl9zZWFyY2giLCJjdXJyZW50IiwiaWQiLCJnZXQiLCJ0aGVuIiwicmVzIiwiZGF0YSIsIl9pbml0Iiwib3B0cyIsInBhcmFtcyIsInN0b3JlIiwiY2hhdHMiLCJwYXJzZSIsIiRodHRwUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCJvdGhlcndpc2UiLCJhYnN0cmFjdCIsInZpZXdzIiwicGFyZW50IiwidGVtcGxhdGUiLCJyZXNvbHZlIiwiY2hhdElkIiwiJHN0YXRlUGFyYW1zIiwicnVuIiwiJHJvb3RTY29wZSIsIiRzdGF0ZSIsIiRvbiIsImV2ZW50IiwidW5mb3VuZFN0YXRlIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImNvbnNvbGUiLCJsb2ciLCJ0byIsInRvUGFyYW1zIiwib3B0aW9ucyIsIiRzY29wZSIsInNvY2tldCIsIm9uIiwiY29uZmlndXJlUm91dGVzIiwiSG9tZUNvbnRyb2xsZXIiLCIkaHR0cCIsImVudiIsInJlcXVlc3RIZWxwIiwiX3JlcXVlc3RIZWxwIiwiZW1pdCIsInN0b3JlX2lkIiwiX2lkIiwiZSIsImFyZ3MiLCJMb2NhdG9yQ29udHJvbGxlciIsImVuc3VyZUF1dGhlbnRpY2F0ZWQiLCIkdGltZW91dCIsImVycm9yU2VydmljZSIsInNob3dTcGxhc2giLCJ0b1N0YXRlIiwicHJldmVudERlZmF1bHQiLCJnZXRDdXJyZW50U3RvcmUiLCJyZXQiLCJnbyIsImNhdGNoIiwiZXJyIiwibGFzdEVycm9yIiwid2FpdGluZ0ZvclZpZXciLCJIZWFkZXJDb250cm9sbGVyIiwiRXJyb3JDb250cm9sbGVyIiwiZXJyb3IiLCJmYWN0b3J5IiwiRXJyb3JTZXJ2aWNlIiwic2VydmljZSIsIkNoYXRMaXN0Q29udHJvbGxlciIsImNyZWF0ZSIsIl9jcmVhdGVOZXdDaGF0IiwicG9zdCIsIm1hcCIsIngiLCJDaGF0IiwibXlEZXZpY2VJZCIsIm90aGVycyIsInBhcnRpY2lwYW50cyIsImZvckVhY2giLCJkZXZpY2UiLCJwdXNoIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJqb2luIiwibGFzdE1lc3NhZ2UiLCJtZXNzYWdlcyIsInNsaWNlIiwiQ2hhdEZhY3RvcnkiLCJzZW5kTWVzc2FnZSIsImluaXQiLCJtZXNzYWdlIiwiJGVtaXQiLCJjaGF0U2VydmljZSIsImNoYXQiLCJzZW5kIiwibXNnIiwidGltZSIsInVzZXIiLCJzZW50IiwiU3RvcmVTZXJ2aWNlIiwiZ2VvTG9jYXRpb24iLCJfY3VycmVudCIsImF2YWlsYWJsZUV2ZW50cyIsIl9nZXRDdXJyZW50U3RvcmUiLCJfcmVnaXN0ZXJMaXN0ZW5lciIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZW51bWVyYWJsZSIsImdldEdwcyIsImdwcyIsImxhdCIsImNvb3JkcyIsImxhdGl0dWRlIiwibG5nIiwibG9uZ2l0dWRlIiwicmVzcG9uc2UiLCJsZW5ndGgiLCJuYW1lIiwiaGFuZGxlciIsImluZGV4T2YiLCJFcnJvciIsInNvY2tldEZhY3RvcnkiLCJzdG9yYWdlU2VydmljZSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJ1cmkiLCJhcGlSb290IiwiZGV2aWNlSWQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJOb3RpZmljYXRpb25TZXJ2aWNlIiwiR2VvTG9jYXRpb25TZXJ2aWNlIiwiJHEiLCIkd2luZG93Iiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCJwb3MiLCIkYXBwbHkiLCJleCIsImNvZGUiLCJwcm9taXNlIiwiRGV2aWNlSW50ZXJjZXB0b3IiLCJhZGRJbnRlcmNlcHRvcnMiLCJyZXF1ZXN0IiwiaGVhZGVycyIsImludGVyY2VwdG9ycyIsIl9jb25maWd1cmVIdHRwIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiYmFzZVVyaSIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQURKQSxRQUFRQyxPQUFPLGtCQUFrQixDQUFDO0tBRzdCO0FDSEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESkQsUUFBUUMsT0FBTyxrQkFDYkMsT0FBT0M7O0lBR1QsU0FBU0EsZUFBZUMsZ0JBQWU7UUFDdENBLGVBQWVDLE1BQU0sVUFBVTtZQUM5QkMsS0FBSztZQUNMQyxZQUFZO1lBQ1pDLGNBQWM7WUFDZEMsYUFBYTs7OztLQUdWO0FDWkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESlQsUUFBUUMsT0FBTyxrQkFDZE0sV0FBVyxzQkFBc0JHOztJQUdsQyxTQUFTQSxtQkFBbUJDLFlBQVlDLGNBQWE7UUFFcEQsSUFBSUMsS0FBS2IsUUFBUWMsT0FBTyxNQUFNO1lBQzdCQyxVQUFVO1lBQ1ZDLE9BQU87WUFDUEMsUUFBUUM7O1FBSVQsU0FBU0EsVUFBUztZQUVqQixJQUFJWixNQUFNLGFBQWFNLGFBQWFPLFFBQVFDLEtBQUssc0JBQXNCUCxHQUFHRztZQUMxRUwsV0FBV1UsSUFBSWYsS0FDZGdCLEtBQUssVUFBU0MsS0FBSTtnQkFDbEJWLEdBQUdFLFdBQVdRLElBQUlDOzs7UUFJcEIsU0FBU0MsUUFBUTtZQUNoQixJQUFJQyxPQUFPLEVBQ1ZDLFFBQVEsRUFDUEMsT0FBT2hCLGFBQWFPLFFBQVFDO1lBSTlCVCxXQUFXVSxJQUFJLG1CQUFtQkssTUFDaENKLEtBQUssVUFBU0MsS0FBSztnQkFDbkJWLEdBQUdnQixRQUFRQyxNQUFNUCxJQUFJQzs7Ozs7S0FScEI7QUN2QkwsQ0FBQyxZQUFZO0lBQ1Q7SUFBSnhCLFFBQVFDLE9BQU8sU0FBUztRQUNwQjtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBRUE7UUFDQTtRQUVBO1FBQ0E7T0FLSEMsaUVBQU8sVUFBVUUsZ0JBQWdCMkIsZUFBZUMsb0JBQW9CO1FB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b0JBQzVCLEtBQUs7d0JBQUcsT0FBT0MsTUFBTUQsT0FBTztvQkFDNUI7d0JBQVMsT0FBT0MsTUFBTUQsT0FBTzs7OztZQUt6QyxPQUFPQyxNQUFNTTs7OztLQURoQjtBQ2hDTCxDQUFDLFlBQVk7SUFDVDtJQUFKekssUUFBUUMsT0FBTyxzQkFBc0IsSUFDbkNvRixRQUFRLHFCQUFxQnFGLG1CQUMxQnhLLE9BQU95SztJQUVaLFNBQVNELGtCQUFrQmQsSUFBSWQsZ0JBQWU7UUFDN0MsT0FBTztZQUNBOEIsU0FBUyxVQUFTMUssUUFBTztnQkFFckIsSUFBRyxDQUFDQSxVQUFVLENBQUNBLE9BQU8ySztvQkFDbEIsT0FBTzNLO2dCQUVYQSxPQUFPMkssUUFBUSxjQUFjL0IsZUFBZXpILElBQUk7Z0JBQ2hELE9BQU9uQjs7Ozs7SUFLbkIsU0FBU3lLLGdCQUFnQjVJLGVBQWM7UUFDdENBLGNBQWMrSSxhQUFhMUUsS0FBSzs7O0tBSDVCO0FDaEJMLENBQUMsWUFBWTtJQUNUO0lBREpwRyxRQUFRQyxPQUFPLFNBQ2RDLE9BQU82Szs7SUFHUixTQUFTQSxlQUFlQyxvQkFBb0JwSCxLQUFLO1FBQzdDb0gsbUJBQW1CQyxVQUFVckgsSUFBSXNGOzs7O0tBR2hDO0FDUkwsQ0FBQyxZQUFZO0lBQ1Q7SUFESmxKLFFBQVFDLE9BQU8sU0FDZGlMLFNBQVMsT0FBTyxFQUNiaEMsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycsIFsndWkucm91dGVyJ10pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcblx0LmNvbmZpZyhyZWdpc3RlclJvdXRlcylcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiByZWdpc3RlclJvdXRlcygkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcclxuXHRcdHVybDogJy9zZWFyY2gnLFxyXG5cdFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RzQ29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9wcm9kdWN0cy9zZWFyY2guaHRtbCdcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5wcm9kdWN0cycpXHJcbi5jb250cm9sbGVyKCdQcm9kdWN0c0NvbnRyb2xsZXInLCBQcm9kdWN0c0NvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIFByb2R1Y3RzQ29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2Upe1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRwcm9kdWN0czogW10sXHJcblx0XHRxdWVyeTogJycsXHJcblx0XHRzZWFyY2g6IF9zZWFyY2hcclxuXHR9KTtcclxuXHJcblxyXG5cdGZ1bmN0aW9uIF9zZWFyY2goKXtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9zdG9yZXMvJyArIHN0b3JlU2VydmljZS5jdXJyZW50LmlkICsgJy9wcm9kdWN0cz9zZWFyY2g9JyArIHZtLnF1ZXJ5O1xyXG5cdFx0aHR0cENsaWVudC5nZXQodXJsKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0dm0ucHJvZHVjdHMgPSByZXMuZGF0YTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gX2luaXQoKSB7XHJcblx0XHR2YXIgb3B0cyA9IHtcclxuXHRcdFx0cGFyYW1zOiB7XHJcblx0XHRcdFx0c3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LmlkXHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy91c2Vycy9tZS9jaGF0cycsIG9wdHMpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLmNoYXRzID0gcGFyc2UocmVzLmRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblxyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbicsIFsgICAgXHJcbiAgICAnc3ltYmlvdGUuY29tbW9uJyxcclxuICAgICdxYXJpbi5wYXJ0aWFscycsXHJcbiAgICAndWkucm91dGVyJyxcclxuICAgICduZ0FuaW1hdGUnLFxyXG4gICAgJ2J0Zm9yZC5zb2NrZXQtaW8nLFxyXG5cclxuICAgICdxYXJpbi5pbnRlcmNlcHRvcnMnLFxyXG4gICAgJ3FhcmluLmVycm9ycycsXHJcbiAgICBcclxuICAgICdxYXJpbi5ob21lJyxcclxuICAgICdxYXJpbi5wcm9kdWN0cydcclxuXHJcbiAgICBdKVxyXG5cclxuXHJcbi5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcclxuICAgIFxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld3M6IHtcclxuICAgICAgICAgICAgICAgICcnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb250cm9sbGVyOiAnUm9vdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xheW91dC9sYXlvdXQuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICxcclxuICAgICAgICAgICAgICAgIC8vIG5vdGlmaWNhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBjb250cm9sbGVyOiAnTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9ucy5odG1sJ1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2xheW91dCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgcGFyZW50OiAncm9vdCcsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzx1aS12aWV3PjwvdWktdmlldz4nXHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICAuc3RhdGUoJ2NoYXQtbGlzdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdsYXlvdXQnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9jaGF0L2NoYXRsaXN0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdExpc3RDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2NoYXQnLCB7XHJcbiAgICAgICAgICAgIHVybDogJy9jaGF0LzppZCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdC5odG1sJyxcclxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0NoYXRDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAndm0nLFxyXG4gICAgICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICAgICAgICBjaGF0SWQ6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzdGF0ZVBhcmFtcy5pZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59KTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsICRzdGF0ZSkge1xyXG5cclxuICAgICRyb290U2NvcGUuJHN0YXRlID0gJHN0YXRlO1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUudG8pOyAvLyBcImxhenkuc3RhdGVcIlxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50b1BhcmFtcyk7IC8vIHthOjEsIGI6Mn1cclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUub3B0aW9ucyk7IC8vIHtpbmhlcml0OmZhbHNlfSArIGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29udHJvbGxlcignTm90aWZpY2F0aW9uc0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBzb2NrZXQpIHtcclxuXHJcbiAgICAkc2NvcGUuY3VycmVudCA9IHt9O1xyXG4gICAgLy9ub3RpZmljYXRpb25Tb2NrZXRcclxuICAgIHNvY2tldC5vbignaGVscCcsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgJHNjb3BlLmN1cnJlbnQgPSBkYXRhO1xyXG4gICAgfSk7XHJcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHBcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0SGVscCgpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnaGVscC1yZXF1ZXN0ZWQnLCB7c3RvcmVfaWQ6IHN0b3JlU2VydmljZS5jdXJyZW50Ll9pZH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG4gICAgICAgIHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuICAgIH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5jb250cm9sbGVyKCdMb2NhdG9yQ29udHJvbGxlcicsIExvY2F0b3JDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBMb2NhdG9yQ29udHJvbGxlcigkc2NvcGUsIHN0b3JlU2VydmljZSkge1xyXG5cclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5ydW4oZW5zdXJlQXV0aGVudGljYXRlZCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZW5zdXJlQXV0aGVudGljYXRlZCgkcm9vdFNjb3BlLCAkc3RhdGUsICR0aW1lb3V0LCBzdG9yZVNlcnZpY2UsIGVycm9yU2VydmljZSkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHQvLyBpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHQvLyBcdHJldHVybjtcclxuXHRcdC8vIH1cclxuXHJcblx0XHR2YXIgc3RvcmUgPSBzdG9yZVNlcnZpY2UuY3VycmVudDtcclxuXHRcdGlmKHN0b3JlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHJcblx0XHRzdG9yZVNlcnZpY2UuZ2V0Q3VycmVudFN0b3JlKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdCRzdGF0ZS5nbyh0b1N0YXRlLCB0b1BhcmFtcyk7XHJcblxyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcclxuXHRcdFx0ZXJyb3JTZXJ2aWNlLmxhc3RFcnJvciA9IGVycjtcclxuXHRcdFx0JHN0YXRlLmdvKCdlcnJvcicpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHQvLyBcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcblx0XHQvLyBcdFx0dmFyIHRhcmdldFN0YXRlID0gdSA/IHRvU3RhdGUgOiAnbG9naW4nO1xyXG5cclxuXHRcdC8vIFx0XHQkc3RhdGUuZ28odGFyZ2V0U3RhdGUpO1xyXG5cdFx0Ly8gXHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdC8vIFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHZhciB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHRcdFxyXG5cdFx0aWYoISRyb290U2NvcGUuc2hvd1NwbGFzaClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHdhaXRpbmdGb3JWaWV3ID0gdHJ1ZTtcclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcclxuXHJcblxyXG5cdFx0aWYgKHdhaXRpbmdGb3JWaWV3ICYmICRyb290U2NvcGUuc2hvd1NwbGFzaCkge1xyXG5cdFx0XHR3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3Nob3dTcGxhc2ggPSBmYWxzZScpO1xyXG5cdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHR9LCAxMCk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ0hlYWRlckNvbnRyb2xsZXInLCBIZWFkZXJDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhlYWRlckNvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudFxyXG5cdH0pO1xyXG5cclxuXHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3MpIHtcclxuXHRcdHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbmZpZyhjb25maWd1cmVSb3V0ZXMpO1xyXG5cclxuZnVuY3Rpb24gY29uZmlndXJlUm91dGVzKCRzdGF0ZVByb3ZpZGVyKXtcclxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnZXJyb3InLCB7XHJcblx0XHR1cmw6ICcvZXJyb3InLFxyXG5cdFx0cGFyZW50OiAncm9vdCcsXHJcblx0XHRjb250cm9sbGVyOiAnRXJyb3JzQ29udHJvbGxlcicsXHJcblx0XHRjb250cm9sbGVyQXM6ICd2bScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9lcnJvcnMvZXJyb3IuaHRtbCdcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG5cdC5jb250cm9sbGVyKCdFcnJvckNvbnRyb2xsZXInLCBFcnJvckNvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yQ29udHJvbGxlcihlcnJvclNlcnZpY2UsICRyb290U2NvcGUpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0ZXJyb3I6IGVycm9yU2VydmljZS5sYXN0RXJyb3JcclxuXHR9KTtcclxuXHJcbiRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5lcnJvcnMnKVxyXG4uZmFjdG9yeSgnZXJyb3JTZXJ2aWNlJywgRXJyb3JTZXJ2aWNlKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBFcnJvclNlcnZpY2UoKXtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRsYXN0RXJyb3I6IG51bGxcclxuXHR9O1xyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignQ2hhdExpc3RDb250cm9sbGVyJywgQ2hhdExpc3RDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBDaGF0TGlzdENvbnRyb2xsZXIoaHR0cENsaWVudCwgc3RvcmVTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGwsXHJcblx0XHRjcmVhdGU6IF9jcmVhdGVOZXdDaGF0XHJcblx0fSk7XHJcblxyXG5cdF9pbml0KCk7XHJcblxyXG5cdGZ1bmN0aW9uIF9pbml0KCkge1xyXG5cdFx0dmFyIG9wdHMgPSB7XHJcblx0XHRcdHBhcmFtczoge1xyXG5cdFx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBfY3JlYXRlTmV3Q2hhdCgpe1xyXG5cdFx0aHR0cENsaWVudC5wb3N0KCcvc3RvcmVzLycgKyBzdG9yZVNlcnZpY2UuY3VycmVudC5pZCArICcvY2hhdCcpXHJcblx0XHQudGhlbihmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHQkc3RhdGUuZ28oJ2NoYXQnLCB7aWQ6IHJlcy5kYXRhLl9pZH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcblxyXG5cdHJldHVybiBkYXRhLm1hcChmdW5jdGlvbih4KSB7XHJcblx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHQvLyBjb3B5IHJhdyBwcm9wZXJ0aWVzXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XHJcblxyXG5cdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHR2YXIgb3RoZXJzID0gW107XHJcblxyXG5cdGRhdGEucGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xyXG5cdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0b3RoZXJzLnB1c2goeC5maXJzdE5hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnVzZXJzID0gb3RoZXJzLmpvaW4oJywgJyk7XHJcblxyXG5cdHRoaXMubGFzdE1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2VzLnNsaWNlKC0xKVswXTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRzZW5kTWVzc2FnZTogc2VuZE1lc3NhZ2UsXHJcblx0fTtcclxuXHJcblx0aW5pdCgpO1xyXG5cclxuXHRyZXR1cm4gc2VydmljZTtcclxuXHJcblx0ZnVuY3Rpb24gc2VuZE1lc3NhZ2UoaWQsIG1lc3NhZ2UpIHtcclxuXHJcblx0XHR2YXIgdXJsID0gJy9jaGF0LycgKyBpZCArICcvbWVzc2FnZXMnO1xyXG5cdFx0cmV0dXJuIGh0dHBDbGllbnQucG9zdCh1cmwsIHttZXNzYWdlOiBtZXNzYWdlfSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzKXtcclxuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ0NoYXRDb250cm9sbGVyJywgZnVuY3Rpb24oc29ja2V0LCBzdG9yZVNlcnZpY2UsIGNoYXRJZCwgaHR0cENsaWVudCwgJHJvb3RTY29wZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0XHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRcdGNoYXQ6IG51bGwsXHJcblx0XHRcdHNlbmQ6IHNlbmRNZXNzYWdlLFxyXG5cdFx0XHRtZXNzYWdlOiAnJ1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9jaGF0LycgKyBjaGF0SWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLmNoYXQgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0JHJvb3RTY29wZS4kb24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGUsIG1zZykge1xyXG5cdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2gobXNnKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKCkge1xyXG5cdFx0XHR2YXIgbWVzc2FnZSA9IHZtLm1lc3NhZ2U7XHJcblx0XHRcdHZtLm1lc3NhZ2UgPSAnJztcclxuXHJcblx0XHRcdGNoYXRTZXJ2aWNlLnNlbmRNZXNzYWdlKGNoYXRJZCwgbWVzc2FnZSlcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihtc2cpIHtcclxuXHRcdFx0XHRcdHZtLmNoYXQubWVzc2FnZXMucHVzaCh7XHJcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IG1zZy5tZXNzYWdlLFxyXG5cdFx0XHRcdFx0XHR0aW1lOiBtc2cudGltZSxcclxuXHRcdFx0XHRcdFx0dXNlcjogbXNnLnVzZXIsXHJcblx0XHRcdFx0XHRcdHNlbnQ6IHRydWVcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH0pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc3RvcmVTZXJ2aWNlJywgU3RvcmVTZXJ2aWNlKTtcclxuXHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGdlb0xvY2F0aW9uLCBodHRwQ2xpZW50LCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50ID0gbnVsbDtcclxuICAgIHZhciBhdmFpbGFibGVFdmVudHMgPSBbJ3N0b3JlQ2hhbmdlZCddO1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0geyAgICAgICAgXHJcbiAgICAgICAgZ2V0Q3VycmVudFN0b3JlOiBfZ2V0Q3VycmVudFN0b3JlLFxyXG4gICAgICAgIG9uOiBfcmVnaXN0ZXJMaXN0ZW5lclxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnQnLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfY3VycmVudDsgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcblxyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9nZXRDdXJyZW50U3RvcmUoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBnZW9Mb2NhdGlvbi5nZXRHcHMoKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZ3BzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsYXQ6IGdwcy5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbG5nOiBncHMuY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cENsaWVudC5nZXQoJy9sb2NhdGlvbnMnLCB7IHBhcmFtczogcGFyYW1zIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY3VycmVudCA9IHJlc3BvbnNlLmRhdGFbMF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnc3RvcmVDaGFuZ2VkJywge3N0b3JlOiBfY3VycmVudH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfY3VycmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX3JlZ2lzdGVyTGlzdGVuZXIobmFtZSwgaGFuZGxlcil7XHJcblxyXG4gICAgICAgIGlmKGF2YWlsYWJsZUV2ZW50cy5pbmRleE9mKG5hbWUpID09PSAtMSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZXZlbnQgXFwnJyArIG5hbWUgKydcXCcgaXMgbm90IGF2YWlsYWJsZSBvbiBzdG9yZVNlcnZpY2UuJyk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKG5hbWUsIGhhbmRsZXIpO1xyXG4gICAgfVxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzb2NrZXRCdWlsZGVyJywgZnVuY3Rpb24gKHNvY2tldEZhY3RvcnksIGVudiwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcbiAgICAgICAgdmFyIGJ1aWxkZXIgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAgICAgICAgIGlmKG5hbWVzcGFjZSlcclxuICAgICAgICAgICAgICAgIHVyaSArPSBuYW1lc3BhY2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGV2aWNlSWQgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KHVyaSwge1xyXG4gICAgICAgICAgICAgICAgcXVlcnk6ICdkZXZpY2U9JyArIGRldmljZUlkXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gYnVpbGRlcjtcclxuXHJcbiAgICB9KVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldCcsIGZ1bmN0aW9uKHNvY2tldEJ1aWxkZXIpIHtcclxuICAgICAgICByZXR1cm4gc29ja2V0QnVpbGRlcigpO1xyXG4gICAgfSk7XHJcbiAgICAiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uZmFjdG9yeSgnbm90aWZpY2F0aW9uU2VydmljZScsIE5vdGlmaWNhdGlvblNlcnZpY2UpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIE5vdGlmaWNhdGlvblNlcnZpY2UoJHJvb3RTY29wZSwgc29ja2V0QnVpbGRlcil7XHJcblxyXG5cdHZhciBzb2NrZXQgPSBzb2NrZXRCdWlsZGVyKCcnKTtcclxuXHJcblx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0Ly9cdCRyb290U2NvcGVcclxuXHR9KTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uZmFjdG9yeSgnZ2VvTG9jYXRpb24nLCBHZW9Mb2NhdGlvblNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEdlb0xvY2F0aW9uU2VydmljZSgkcSwgJHdpbmRvdywgJHJvb3RTY29wZSkge1xyXG5cclxuICAgIHZhciB3YXRjaGVyQ291bnQgPSAwO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZ2V0R3BzOiBfY3VycmVudFBvc2l0aW9uLFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gX2N1cnJlbnRQb3NpdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKCEkd2luZG93Lm5hdmlnYXRvci5nZW9sb2NhdGlvbilcclxuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCgnR1BTIGlzIG5vdCBhdmFpbGFibGUgb24geW91ciBkZXZpY2UuJyk7XHJcblxyXG4gICAgICAgIHZhciBkZWZlciA9ICRxLmRlZmVyKCk7XHJcbiAgICAgICAgJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKGZ1bmN0aW9uIChwb3MpIHtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkgeyBkZWZlci5yZXNvbHZlKHBvcyk7IH0pO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChleCkge1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXguY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGRlZmVyLnJlamVjdCgnUGVybWlzc2lvbiBEZW5pZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBkZWZlci5yZWplY3QoJ1Bvc2l0aW9uIFVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVmZXIucmVqZWN0KCdUaW1lb3V0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGRlZmVyLnJlamVjdCgnVW5rb3duJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG59IiwiXHJcbmFuZ3VsYXIubW9kdWxlKCdxYXJpbi5pbnRlcmNlcHRvcnMnLCBbXSlcclxuXHQuZmFjdG9yeSgnZGV2aWNlSW50ZXJjZXB0b3InLCBEZXZpY2VJbnRlcmNlcHRvcilcclxuICAgIC5jb25maWcoYWRkSW50ZXJjZXB0b3JzKTtcclxuXHJcbmZ1bmN0aW9uIERldmljZUludGVyY2VwdG9yKCRxLCBzdG9yYWdlU2VydmljZSl7XHJcblx0cmV0dXJuIHtcclxuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpe1xyXG5cclxuICAgICAgICAgICAgaWYoIWNvbmZpZyB8fCAhY29uZmlnLmhlYWRlcnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG5cclxuICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbJ3gtZGV2aWNlJ10gPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEludGVyY2VwdG9ycygkaHR0cFByb3ZpZGVyKXtcclxuXHQkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdkZXZpY2VJbnRlcmNlcHRvcicpO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbmZpZyhfY29uZmlndXJlSHR0cCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gX2NvbmZpZ3VyZUh0dHAoaHR0cENsaWVudFByb3ZpZGVyLCBlbnYpIHtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAvL2h0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5OYW1lID0gXCJ0b2tlblwiO1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuVHlwZSA9IFwiQmVhcmVyXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29uc3RhbnQoJ2VudicsIHtcclxuICAgIGFwaVJvb3Q6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==