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
    function ProductsController() {
    }
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
    function ChatListController(httpClient, storeService) {
        var vm = angular.extend(this, { chats: null });
        var opts = {
            params: { store: storeService.current.id },
            headers: { 'x-device': 'dev-1' }
        };
        httpClient.get('/users/me/chats', opts).then(function (res) {
            vm.chats = parse(res.data);
        });
    }
    ChatListController.$inject = ["httpClient", "storeService"];
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
            return httpClient.post(url, { message: message }, {});
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
                vm.chat.messages.push({ message: message });
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
    angular.module('qarin.interceptors', []).factory('deviceInterceptor', DeviceInterceptor);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLm1vZHVsZS5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLnJvdXRlcy5qcyIsImFyZWFzL3Byb2R1Y3RzL3Byb2R1Y3RzLmNvbnRyb2xsZXIuanMiLCJhcHAuanMiLCJhcmVhcy9ub3RpZmljYXRpb25zL05vdGlmaWNhdGlvbnNDb250cm9sbGVyLmpzIiwiYXJlYXMvbGF5b3V0L2xvY2F0b3IuY29udHJvbGxlci5qcyIsImFyZWFzL2xheW91dC9sYXlvdXQuY29uZmlnLmpzIiwiYXJlYXMvbGF5b3V0L2hlYWRlci5jb250cm9sbGVyLmpzIiwiYXJlYXMvaG9tZS9ob21lLm1vZHVsZS5qcyIsImFyZWFzL2hvbWUvaG9tZS5yb3V0ZXMuanMiLCJhcmVhcy9ob21lL0hvbWVDb250cm9sbGVyLmpzIiwiYXJlYXMvZXJyb3JzL2Vycm9ycy5tb2R1bGUuanMiLCJhcmVhcy9lcnJvcnMvZXJyb3JzLnJvdXRlcy5qcyIsImFyZWFzL2Vycm9ycy9lcnJvcnMuY29udHJvbGxlci5qcyIsImFyZWFzL2Vycm9ycy9lcnJvci5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9jaGF0bGlzdC5jb250cm9sbGVyLmpzIiwiYXJlYXMvY2hhdC9jaGF0LnNlcnZpY2UuanMiLCJhcmVhcy9jaGF0L0NoYXRDb250cm9sbGVyLmpzIiwic2VydmljZXMvc3RvcmVTZXJ2aWNlLmpzIiwic2VydmljZXMvc29ja2V0cy5qcyIsInNlcnZpY2VzL25vdGlmaWNhdGlvbi5zZXJ2aWNlLmpzIiwic2VydmljZXMvZ2VvTG9jYXRpb25TZXJ2aWNlLmpzIiwic2VydmljZXMvZGV2aWNlSW50ZXJjZXB0b3IuanMiLCJjb25maWcvaHR0cC5qcyIsImNvbmZpZy9lbnZpcm9ubWVudC5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwicmVnaXN0ZXJSb3V0ZXMiLCIkc3RhdGVQcm92aWRlciIsInN0YXRlIiwidXJsIiwiY29udHJvbGxlciIsImNvbnRyb2xsZXJBcyIsInRlbXBsYXRlVXJsIiwiUHJvZHVjdHNDb250cm9sbGVyIiwiJGh0dHBQcm92aWRlciIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIm90aGVyd2lzZSIsImFic3RyYWN0Iiwidmlld3MiLCJwYXJlbnQiLCJ0ZW1wbGF0ZSIsInJlc29sdmUiLCJjaGF0SWQiLCIkc3RhdGVQYXJhbXMiLCJpZCIsInJ1biIsIiRyb290U2NvcGUiLCIkc3RhdGUiLCIkb24iLCJldmVudCIsInVuZm91bmRTdGF0ZSIsImZyb21TdGF0ZSIsImZyb21QYXJhbXMiLCJjb25zb2xlIiwibG9nIiwidG8iLCJ0b1BhcmFtcyIsIm9wdGlvbnMiLCIkc2NvcGUiLCJzb2NrZXQiLCJjdXJyZW50Iiwib24iLCJkYXRhIiwiTG9jYXRvckNvbnRyb2xsZXIiLCJzdG9yZVNlcnZpY2UiLCJlbnN1cmVBdXRoZW50aWNhdGVkIiwiJHRpbWVvdXQiLCJlcnJvclNlcnZpY2UiLCJzaG93U3BsYXNoIiwiZSIsInRvU3RhdGUiLCJzdG9yZSIsInByZXZlbnREZWZhdWx0IiwiZ2V0Q3VycmVudFN0b3JlIiwidGhlbiIsInJldCIsImdvIiwiY2F0Y2giLCJlcnIiLCJsYXN0RXJyb3IiLCJ3YWl0aW5nRm9yVmlldyIsIkhlYWRlckNvbnRyb2xsZXIiLCJ2bSIsImV4dGVuZCIsImFyZ3MiLCJjb25maWd1cmVSb3V0ZXMiLCJIb21lQ29udHJvbGxlciIsIiRodHRwIiwiZW52IiwicmVxdWVzdEhlbHAiLCJfcmVxdWVzdEhlbHAiLCJlbWl0Iiwic3RvcmVfaWQiLCJfaWQiLCJFcnJvckNvbnRyb2xsZXIiLCJlcnJvciIsImZhY3RvcnkiLCJFcnJvclNlcnZpY2UiLCJzZXJ2aWNlIiwiQ2hhdExpc3RDb250cm9sbGVyIiwiaHR0cENsaWVudCIsImNoYXRzIiwib3B0cyIsInBhcmFtcyIsImhlYWRlcnMiLCJnZXQiLCJyZXMiLCJwYXJzZSIsIm1hcCIsIngiLCJDaGF0IiwibXlEZXZpY2VJZCIsIm90aGVycyIsInBhcnRpY2lwYW50cyIsImZvckVhY2giLCJkZXZpY2UiLCJwdXNoIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJqb2luIiwibGFzdE1lc3NhZ2UiLCJtZXNzYWdlcyIsInNsaWNlIiwiQ2hhdEZhY3RvcnkiLCJzZW5kTWVzc2FnZSIsImluaXQiLCJtZXNzYWdlIiwicG9zdCIsIiRlbWl0IiwiY2hhdFNlcnZpY2UiLCJjaGF0Iiwic2VuZCIsIm1zZyIsIlN0b3JlU2VydmljZSIsImdlb0xvY2F0aW9uIiwiX2N1cnJlbnQiLCJhdmFpbGFibGVFdmVudHMiLCJfZ2V0Q3VycmVudFN0b3JlIiwiX3JlZ2lzdGVyTGlzdGVuZXIiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJnZXRHcHMiLCJncHMiLCJsYXQiLCJjb29yZHMiLCJsYXRpdHVkZSIsImxuZyIsImxvbmdpdHVkZSIsInJlc3BvbnNlIiwibGVuZ3RoIiwibmFtZSIsImhhbmRsZXIiLCJpbmRleE9mIiwiRXJyb3IiLCJzb2NrZXRGYWN0b3J5Iiwic3RvcmFnZVNlcnZpY2UiLCJidWlsZGVyIiwibmFtZXNwYWNlIiwidXJpIiwiYXBpUm9vdCIsImRldmljZUlkIiwibXlJb1NvY2tldCIsImlvIiwiY29ubmVjdCIsInF1ZXJ5IiwibXlTb2NrZXQiLCJpb1NvY2tldCIsInNvY2tldEJ1aWxkZXIiLCJOb3RpZmljYXRpb25TZXJ2aWNlIiwiR2VvTG9jYXRpb25TZXJ2aWNlIiwiJHEiLCIkd2luZG93Iiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCJwb3MiLCIkYXBwbHkiLCJleCIsImNvZGUiLCJwcm9taXNlIiwiRGV2aWNlSW50ZXJjZXB0b3IiLCJyZXF1ZXN0IiwiYWRkSW50ZXJjZXB0b3JzIiwiaW50ZXJjZXB0b3JzIiwiX2NvbmZpZ3VyZUh0dHAiLCJodHRwQ2xpZW50UHJvdmlkZXIiLCJiYXNlVXJpIiwiY29uc3Rh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QVk7b0JBQUVILE1BQU16SSxRQUFRMkk7O2VBQy9DLFVBQVVFLElBQUk7Z0JBRWJ4SSxXQUFXdUksT0FBTyxZQUFZO29CQUUxQixRQUFRQyxHQUFHQztvQkFDUCxLQUFLO3dCQUFHLE9BQU9MLE1BQU1ELE9BQU87b0JBQzVCLEtBQUs7d0JBQUcsT0FBT0MsTUFBTUQsT0FBTztvQkFDNUIsS0FBSzt3QkFBRyxPQUFPQyxNQUFNRCxPQUFPO29CQUM1Qjt3QkFBUyxPQUFPQyxNQUFNRCxPQUFPOzs7O1lBS3pDLE9BQU9DLE1BQU1NOzs7O0tBRGhCO0FDaENMLENBQUMsWUFBWTtJQUNUO0lBQUpqSyxRQUFRQyxPQUFPLHNCQUFzQixJQUNuQ3dFLFFBQVEscUJBQXFCeUY7SUFFL0IsU0FBU0Esa0JBQWtCZCxJQUFJZixnQkFBZTtRQUM3QyxPQUFPO1lBQ0E4QixTQUFTLFVBQVNqSyxRQUFPO2dCQUVyQixJQUFHLENBQUNBLFVBQVUsQ0FBQ0EsT0FBTytFO29CQUNsQixPQUFPL0U7Z0JBRVhBLE9BQU8rRSxRQUFRLGNBQWNvRCxlQUFlbkQsSUFBSTtnQkFDaEQsT0FBT2hGOzs7OztJQUtuQixTQUFTa0ssZ0JBQWdCekosZUFBYztRQUN0Q0EsY0FBYzBKLGFBQWF4RSxLQUFLOztLQUY1QjtBQ2hCTCxDQUFDLFlBQVk7SUFDVDtJQURKN0YsUUFBUUMsT0FBTyxTQUNkQyxPQUFPb0s7O0lBR1IsU0FBU0EsZUFBZUMsb0JBQW9CdEcsS0FBSztRQUM3Q3NHLG1CQUFtQkMsVUFBVXZHLElBQUl3RTs7OztLQUdoQztBQ1JMLENBQUMsWUFBWTtJQUNUO0lBREp6SSxRQUFRQyxPQUFPLFNBQ2R3SyxTQUFTLE9BQU8sRUFDYmhDLFNBQVM7S0FDUiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnLCBbJ3VpLnJvdXRlciddKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG5cdC5jb25maWcocmVnaXN0ZXJSb3V0ZXMpXHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gcmVnaXN0ZXJSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XHJcblx0XHR1cmw6ICcvc2VhcmNoJyxcclxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0c0NvbnRyb2xsZXInLFxyXG5cdFx0Y29udHJvbGxlckFzOiAndm0nLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvcHJvZHVjdHMvc2VhcmNoLmh0bWwnXHJcblx0fSk7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4ucHJvZHVjdHMnKVxyXG4uY29udHJvbGxlcignUHJvZHVjdHNDb250cm9sbGVyJywgUHJvZHVjdHNDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBQcm9kdWN0c0NvbnRyb2xsZXIoKXtcclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJywgWyAgICBcclxuICAgICdzeW1iaW90ZS5jb21tb24nLFxyXG4gICAgJ3FhcmluLnBhcnRpYWxzJyxcclxuICAgICd1aS5yb3V0ZXInLFxyXG4gICAgJ25nQW5pbWF0ZScsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbycsXHJcblxyXG4gICAgJ3FhcmluLmludGVyY2VwdG9ycycsXHJcbiAgICAncWFyaW4uZXJyb3JzJyxcclxuICAgIFxyXG4gICAgJ3FhcmluLmhvbWUnLFxyXG4gICAgJ3FhcmluLnByb2R1Y3RzJ1xyXG5cclxuICAgIF0pXHJcblxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xyXG4gICAgXHJcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XHJcblxyXG4gICAgJHN0YXRlUHJvdmlkZXJcclxuICAgICAgICAuc3RhdGUoJ3Jvb3QnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB2aWV3czoge1xyXG4gICAgICAgICAgICAgICAgJyc6IHtcclxuICAgICAgICAgICAgICAgICAgICAvL2NvbnRyb2xsZXI6ICdSb290Q29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbGF5b3V0L2xheW91dC5odG1sJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gLFxyXG4gICAgICAgICAgICAgICAgLy8gbm90aWZpY2F0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnRyb2xsZXI6ICdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnXHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbGF5b3V0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHVpLXZpZXc+PC91aS12aWV3PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvY2hhdCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQvOmlkJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlUGFyYW1zLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHN0YXRlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kc3RhdGUgPSAkc3RhdGU7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KTtcclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5jb250cm9sbGVyKCdMb2NhdG9yQ29udHJvbGxlcicsIExvY2F0b3JDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBMb2NhdG9yQ29udHJvbGxlcigkc2NvcGUsIHN0b3JlU2VydmljZSkge1xyXG5cclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5ydW4oZW5zdXJlQXV0aGVudGljYXRlZCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gZW5zdXJlQXV0aGVudGljYXRlZCgkcm9vdFNjb3BlLCAkc3RhdGUsICR0aW1lb3V0LCBzdG9yZVNlcnZpY2UsIGVycm9yU2VydmljZSkge1xyXG5cdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IHRydWU7XHJcblxyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHJcblx0XHQvLyBpZiAodG9TdGF0ZS5uYW1lID09PSAnbG9naW4nKSB7XHJcblx0XHQvLyBcdHJldHVybjtcclxuXHRcdC8vIH1cclxuXHJcblx0XHR2YXIgc3RvcmUgPSBzdG9yZVNlcnZpY2UuY3VycmVudDtcclxuXHRcdGlmKHN0b3JlKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHJcblx0XHRzdG9yZVNlcnZpY2UuZ2V0Q3VycmVudFN0b3JlKClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJldCl7XHJcblx0XHRcdCRzdGF0ZS5nbyh0b1N0YXRlLCB0b1BhcmFtcyk7XHJcblxyXG5cdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcclxuXHRcdFx0ZXJyb3JTZXJ2aWNlLmxhc3RFcnJvciA9IGVycjtcclxuXHRcdFx0JHN0YXRlLmdvKCdlcnJvcicpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gc2VjdXJpdHlTZXJ2aWNlLnJlcXVlc3RDdXJyZW50VXNlcigpXHJcblx0XHQvLyBcdC50aGVuKGZ1bmN0aW9uKHUpIHtcclxuXHJcblx0XHQvLyBcdFx0dmFyIHRhcmdldFN0YXRlID0gdSA/IHRvU3RhdGUgOiAnbG9naW4nO1xyXG5cclxuXHRcdC8vIFx0XHQkc3RhdGUuZ28odGFyZ2V0U3RhdGUpO1xyXG5cdFx0Ly8gXHR9KS5jYXRjaChmdW5jdGlvbihleCkge1xyXG5cdFx0Ly8gXHRcdCRzdGF0ZS5nbygnbG9naW4nKTtcclxuXHRcdC8vIFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdHZhciB3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuXHRcdFxyXG5cdFx0aWYoISRyb290U2NvcGUuc2hvd1NwbGFzaClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdHdhaXRpbmdGb3JWaWV3ID0gdHJ1ZTtcclxuXHR9KTtcclxuXHJcblx0JHJvb3RTY29wZS4kb24oJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKGUpIHtcclxuXHJcblxyXG5cdFx0aWYgKHdhaXRpbmdGb3JWaWV3ICYmICRyb290U2NvcGUuc2hvd1NwbGFzaCkge1xyXG5cdFx0XHR3YWl0aW5nRm9yVmlldyA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ2dpdmUgdGltZSB0byByZW5kZXInKTtcclxuXHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ3Nob3dTcGxhc2ggPSBmYWxzZScpO1xyXG5cdFx0XHRcdCRyb290U2NvcGUuc2hvd1NwbGFzaCA9IGZhbHNlO1xyXG5cdFx0XHR9LCAxMCk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ0hlYWRlckNvbnRyb2xsZXInLCBIZWFkZXJDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhlYWRlckNvbnRyb2xsZXIoc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudFxyXG5cdH0pO1xyXG5cclxuXHRzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3MpIHtcclxuXHRcdHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuXHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJywgWyd1aS5yb3V0ZXInXSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmhvbWUnKVxyXG5cdC5jb25maWcoY29uZmlndXJlUm91dGVzKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnaG9tZScsIHtcclxuXHRcdFx0dXJsOiAnLycsXHJcblx0XHRcdHBhcmVudDogJ2xheW91dCcsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2hvbWUvaG9tZS5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcclxuXHRcdFx0Y29udHJvbGxlckFzOiAndm0nXHJcblx0XHR9KTtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbi5ob21lJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgc29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICB2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcbiAgICAgICAgc3RvcmU6IHN0b3JlU2VydmljZS5jdXJyZW50LFxyXG4gICAgICAgIHJlcXVlc3RIZWxwOiBfcmVxdWVzdEhlbHBcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9yZXF1ZXN0SGVscCgpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdCgnaGVscC1yZXF1ZXN0ZWQnLCB7c3RvcmVfaWQ6IHN0b3JlU2VydmljZS5jdXJyZW50Ll9pZH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBzdG9yZVNlcnZpY2Uub24oJ3N0b3JlQ2hhbmdlZCcsIGZ1bmN0aW9uKGUsIGFyZ3Mpe1xyXG4gICAgICAgIHZtLnN0b3JlID0gYXJncy5zdG9yZTtcclxuICAgIH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycsIFtdKTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4uZXJyb3JzJylcclxuXHQuY29uZmlnKGNvbmZpZ3VyZVJvdXRlcyk7XHJcblxyXG5mdW5jdGlvbiBjb25maWd1cmVSb3V0ZXMoJHN0YXRlUHJvdmlkZXIpe1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdlcnJvcicsIHtcclxuXHRcdHVybDogJy9lcnJvcicsXHJcblx0XHRwYXJlbnQ6ICdyb290JyxcclxuXHRcdGNvbnRyb2xsZXI6ICdFcnJvcnNDb250cm9sbGVyJyxcclxuXHRcdGNvbnRyb2xsZXJBczogJ3ZtJyxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2Vycm9ycy9lcnJvci5odG1sJ1xyXG5cdH0pO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcblx0LmNvbnRyb2xsZXIoJ0Vycm9yQ29udHJvbGxlcicsIEVycm9yQ29udHJvbGxlcik7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gRXJyb3JDb250cm9sbGVyKGVycm9yU2VydmljZSwgJHJvb3RTY29wZSkge1xyXG5cclxuXHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRlcnJvcjogZXJyb3JTZXJ2aWNlLmxhc3RFcnJvclxyXG5cdH0pO1xyXG5cclxuJHJvb3RTY29wZS5zaG93U3BsYXNoID0gZmFsc2U7XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluLmVycm9ycycpXHJcbi5mYWN0b3J5KCdlcnJvclNlcnZpY2UnLCBFcnJvclNlcnZpY2UpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIEVycm9yU2VydmljZSgpe1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdGxhc3RFcnJvcjogbnVsbFxyXG5cdH07XHJcblx0cmV0dXJuIHNlcnZpY2U7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0TGlzdENvbnRyb2xsZXInLCBDaGF0TGlzdENvbnRyb2xsZXIpO1xyXG5cclxuLy8gQG5nSW5qZWN0XHJcbmZ1bmN0aW9uIENoYXRMaXN0Q29udHJvbGxlcihodHRwQ2xpZW50LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcblx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0Y2hhdHM6IG51bGxcclxuXHR9KTtcclxuXHJcblxyXG5cdHZhciBvcHRzID0ge1xyXG5cdFx0cGFyYW1zOiB7XHJcblx0XHRcdHN0b3JlOiBzdG9yZVNlcnZpY2UuY3VycmVudC5pZFxyXG5cdFx0fSxcclxuXHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0J3gtZGV2aWNlJzogJ2Rldi0xJ1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdGh0dHBDbGllbnQuZ2V0KCcvdXNlcnMvbWUvY2hhdHMnLCBvcHRzKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRcdHZtLmNoYXRzID0gcGFyc2UocmVzLmRhdGEpO1xyXG5cdFx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlKGRhdGEpIHtcclxuXHJcblx0cmV0dXJuIGRhdGEubWFwKGZ1bmN0aW9uKHgpIHtcclxuXHRcdHJldHVybiBuZXcgQ2hhdCh4KTtcclxuXHR9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gQ2hhdChkYXRhKSB7XHJcblxyXG5cdC8vIGNvcHkgcmF3IHByb3BlcnRpZXNcclxuXHRhbmd1bGFyLmV4dGVuZCh0aGlzLCBkYXRhKTtcclxuXHJcblx0dmFyIG15RGV2aWNlSWQgPSAnZGV2LTEnO1xyXG5cdHZhciBvdGhlcnMgPSBbXTtcclxuXHJcblx0ZGF0YS5wYXJ0aWNpcGFudHMuZm9yRWFjaChmdW5jdGlvbih4KSB7XHJcblx0XHRpZiAoeC5kZXZpY2UgPT09IG15RGV2aWNlSWQpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRvdGhlcnMucHVzaCh4LmZpcnN0TmFtZSk7XHJcblx0fSk7XHJcblxyXG5cdHRoaXMudXNlcnMgPSBvdGhlcnMuam9pbignLCAnKTtcclxuXHJcblx0dGhpcy5sYXN0TWVzc2FnZSA9IGRhdGEubWVzc2FnZXMuc2xpY2UoLTEpWzBdO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmZhY3RvcnkoJ2NoYXRTZXJ2aWNlJywgQ2hhdEZhY3RvcnkpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIENoYXRGYWN0b3J5KCRyb290U2NvcGUsIGh0dHBDbGllbnQsIHNvY2tldCkge1xyXG5cclxuXHR2YXIgc2VydmljZSA9IHtcclxuXHRcdHNlbmRNZXNzYWdlOiBzZW5kTWVzc2FnZSxcclxuXHR9O1xyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge21lc3NhZ2U6IG1lc3NhZ2V9LHt9KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXQoKXtcclxuXHRcdHNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRjb25zb2xlLmxvZyhkYXRhKTtcclxuXHRcdFx0JHJvb3RTY29wZS4kZW1pdCgnY2hhdC1tZXNzYWdlJywgZGF0YSk7XHJcblx0XHR9KTtcclxuXHR9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5jb250cm9sbGVyKCdDaGF0Q29udHJvbGxlcicsIGZ1bmN0aW9uKHNvY2tldCwgc3RvcmVTZXJ2aWNlLCBjaGF0SWQsIGh0dHBDbGllbnQsICRyb290U2NvcGUsIGNoYXRTZXJ2aWNlKSB7XHJcblxyXG5cdFx0dmFyIHZtID0gYW5ndWxhci5leHRlbmQodGhpcywge1xyXG5cdFx0XHRjaGF0OiBudWxsLFxyXG5cdFx0XHRzZW5kOiBzZW5kTWVzc2FnZSxcclxuXHRcdFx0bWVzc2FnZTogJydcclxuXHRcdH0pO1xyXG5cclxuXHRcdGh0dHBDbGllbnQuZ2V0KCcvY2hhdC8nICsgY2hhdElkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0XHR2bS5jaGF0ID0gcmVzLmRhdGE7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdCRyb290U2NvcGUuJG9uKCdjaGF0LW1lc3NhZ2UnLCBmdW5jdGlvbihlLCBtc2cpIHtcclxuXHRcdFx0dm0uY2hhdC5tZXNzYWdlcy5wdXNoKG1zZyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSB2bS5tZXNzYWdlO1xyXG4gICAgICAgICAgICB2bS5tZXNzYWdlID0gJyc7XHJcblxyXG4gICAgICAgICAgICBjaGF0U2VydmljZS5zZW5kTWVzc2FnZShjaGF0SWQsIG1lc3NhZ2UpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKG1zZyl7XHJcbiAgICAgICAgICAgICAgICB2bS5jaGF0Lm1lc3NhZ2VzLnB1c2goe21lc3NhZ2U6IG1lc3NhZ2V9KTtcclxuICAgICAgICAgICAgfSk7XHJcblx0XHR9XHJcblx0fSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoZ2VvTG9jYXRpb24sIGh0dHBDbGllbnQsICRyb290U2NvcGUpIHtcclxuXHJcbiAgICB2YXIgX2N1cnJlbnQgPSBudWxsO1xyXG4gICAgdmFyIGF2YWlsYWJsZUV2ZW50cyA9IFsnc3RvcmVDaGFuZ2VkJ107XHJcblxyXG4gICAgdmFyIHNlcnZpY2UgPSB7ICAgICAgICBcclxuICAgICAgICBnZXRDdXJyZW50U3RvcmU6IF9nZXRDdXJyZW50U3RvcmUsXHJcbiAgICAgICAgb246IF9yZWdpc3Rlckxpc3RlbmVyXHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudCcsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF9jdXJyZW50OyB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgcmV0dXJuIHNlcnZpY2U7XHJcblxyXG4gICAgZnVuY3Rpb24gX2dldEN1cnJlbnRTdG9yZSgpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdlb0xvY2F0aW9uLmdldEdwcygpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncHMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhdDogZ3BzLmNvb3Jkcy5sYXRpdHVkZSxcclxuICAgICAgICAgICAgICAgICAgICBsbmc6IGdwcy5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBodHRwQ2xpZW50LmdldCgnL2xvY2F0aW9ucycsIHsgcGFyYW1zOiBwYXJhbXMgfSlcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEubGVuZ3RoID49IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9jdXJyZW50ID0gcmVzcG9uc2UuZGF0YVswXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRlbWl0KCdzdG9yZUNoYW5nZWQnLCB7c3RvcmU6IF9jdXJyZW50fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9jdXJyZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfcmVnaXN0ZXJMaXN0ZW5lcihuYW1lLCBoYW5kbGVyKXtcclxuXHJcbiAgICAgICAgaWYoYXZhaWxhYmxlRXZlbnRzLmluZGV4T2YobmFtZSkgPT09IC0xKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBldmVudCBcXCcnICsgbmFtZSArJ1xcJyBpcyBub3QgYXZhaWxhYmxlIG9uIHN0b3JlU2VydmljZS4nKTtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS4kb24obmFtZSwgaGFuZGxlcik7XHJcbiAgICB9XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52LCBzdG9yYWdlU2VydmljZSkge1xyXG5cclxuICAgICAgICB2YXIgYnVpbGRlciA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB1cmkgPSBlbnYuYXBpUm9vdDtcclxuICAgICAgICAgICAgaWYobmFtZXNwYWNlKVxyXG4gICAgICAgICAgICAgICAgdXJpICs9IG5hbWVzcGFjZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkZXZpY2VJZCA9IHN0b3JhZ2VTZXJ2aWNlLmdldCgnZGV2aWNlJyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbXlJb1NvY2tldCA9IGlvLmNvbm5lY3QodXJpLCB7XHJcbiAgICAgICAgICAgICAgICBxdWVyeTogJ2RldmljZT0nICsgZGV2aWNlSWRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbXlTb2NrZXQgPSBzb2NrZXRGYWN0b3J5KHtcclxuICAgICAgICAgICAgICAgIGlvU29ja2V0OiBteUlvU29ja2V0XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG15U29ja2V0O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0JywgZnVuY3Rpb24oc29ja2V0QnVpbGRlcikge1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuICAgICIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5mYWN0b3J5KCdub3RpZmljYXRpb25TZXJ2aWNlJywgTm90aWZpY2F0aW9uU2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gTm90aWZpY2F0aW9uU2VydmljZSgkcm9vdFNjb3BlLCBzb2NrZXRCdWlsZGVyKXtcclxuXHJcblx0dmFyIHNvY2tldCA9IHNvY2tldEJ1aWxkZXIoJycpO1xyXG5cclxuXHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHQvL1x0JHJvb3RTY29wZVxyXG5cdH0pO1xyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5mYWN0b3J5KCdnZW9Mb2NhdGlvbicsIEdlb0xvY2F0aW9uU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gR2VvTG9jYXRpb25TZXJ2aWNlKCRxLCAkd2luZG93LCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgdmFyIHdhdGNoZXJDb3VudCA9IDA7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRHcHM6IF9jdXJyZW50UG9zaXRpb24sXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBfY3VycmVudFBvc2l0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiAoISR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uKVxyXG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KCdHUFMgaXMgbm90IGF2YWlsYWJsZSBvbiB5b3VyIGRldmljZS4nKTtcclxuXHJcbiAgICAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKTtcclxuICAgICAgICAkd2luZG93Lm5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oZnVuY3Rpb24gKHBvcykge1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7IGRlZmVyLnJlc29sdmUocG9zKTsgfSk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24gKGV4KSB7XHJcblxyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChleC5jb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZGVmZXIucmVqZWN0KCdQZXJtaXNzaW9uIERlbmllZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjogcmV0dXJuIGRlZmVyLnJlamVjdCgnUG9zaXRpb24gVW5hdmFpbGFibGUnKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6IHJldHVybiBkZWZlci5yZWplY3QoJ1RpbWVvdXQnKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gZGVmZXIucmVqZWN0KCdVbmtvd24nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbn0iLCJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluLmludGVyY2VwdG9ycycsIFtdKVxyXG5cdC5mYWN0b3J5KCdkZXZpY2VJbnRlcmNlcHRvcicsIERldmljZUludGVyY2VwdG9yKTtcclxuXHJcbmZ1bmN0aW9uIERldmljZUludGVyY2VwdG9yKCRxLCBzdG9yYWdlU2VydmljZSl7XHJcblx0cmV0dXJuIHtcclxuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpe1xyXG5cclxuICAgICAgICAgICAgaWYoIWNvbmZpZyB8fCAhY29uZmlnLmhlYWRlcnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG5cclxuICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbJ3gtZGV2aWNlJ10gPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZEludGVyY2VwdG9ycygkaHR0cFByb3ZpZGVyKXtcclxuXHQkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdkZXZpY2VJbnRlcmNlcHRvcicpO1xyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbmZpZyhfY29uZmlndXJlSHR0cCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gX2NvbmZpZ3VyZUh0dHAoaHR0cENsaWVudFByb3ZpZGVyLCBlbnYpIHtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAvL2h0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5OYW1lID0gXCJ0b2tlblwiO1xyXG4gICAgLy9odHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuVHlwZSA9IFwiQmVhcmVyXCI7XHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uY29uc3RhbnQoJ2VudicsIHtcclxuICAgIGFwaVJvb3Q6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==