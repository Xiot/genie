(function () {
    'use strict';
    angular.module('qarin', [
        'symbiote.common',
        'qarin.partials',
        'ui.router',
        'btford.socket-io'
    ]).config(["$stateProvider", "$httpProvider", function ($stateProvider, $httpProvider) {
        $httpProvider.interceptors.push('deviceInterceptor');
        $stateProvider.state('root', {
            url: '',
            abstract: true,
            views: {
                '': {
                    //controller: 'RootController',
                    templateUrl: 'app/areas/layout/layout.html'
                },
                notifications: {
                    controller: 'NotificationsController',
                    templateUrl: 'app/areas/notifications/notifications.html'
                }
            }
        }).state('layout', {
            url: '',
            parent: 'root',
            abstract: true,
            template: '<ui-view></ui-view>'
        }).state('home', {
            url: '',
            parent: 'layout',
            templateUrl: 'app/areas/home/home.html',
            controller: 'HomeController'
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
    angular.module('qarin').run(["$rootScope", function ($rootScope) {
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            console.log(unfoundState.to);
            // "lazy.state"
            console.log(unfoundState.toParams);
            // {a:1, b:2}
            console.log(unfoundState.options);    // {inherit:false} + default options
        });
    }]);
    angular.module('qarin').factory('deviceInterceptor', ["$q", "storageService", function ($q, storageService) {
        return {
            request: function (config) {
                if (!config || !config.headers)
                    return config;
                config.headers['x-device'] = storageService.get('device');
                return config;
            }
        };
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
    angular.module('qarin').controller('HomeController', HomeController);
    function HomeController($scope, $http, env, socket, storeService) {
        $scope.requestHelp = function () {
            //notificationSocket
            socket.emit('help-requested', { store_id: storeService.current._id });
        };
        $scope.searching = true;
        $scope.searchError = '';
        storeService.getCurrentStore().then(function (store) {
            $scope.store = store;
        }).catch(function (ex) {
            $scope.searchError = ex;
        }).finally(function () {
            $scope.searching = false;
        });
    }
    HomeController.$inject = ["$scope", "$http", "env", "socket", "storeService"];
    ;
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
            });    // httpClient.post('/chat/' + chatId + '/messages', {
                   // 		message: vm.message
                   // 	})
                   // 	.then(function(res) {
                   // 		console.log(res);
                   // 		vm.message = '';
                   // 	});
        }    // var me = this;
             // socket.on('init', function (data) {
             //     me.name = data.name;
             // })
             // chatSocket.on('chat', function (msg) {
             //     me.messages.push(msg);
             // })
             // this.messages = [];
             // this.name = "";
             // this.message = "";
             // this.send = function () {
             //     chatSocket.emit('chat', this.message);
             // }
    }]);
}());
(function () {
    'use strict';
    angular.module('qarin').factory('storeService', StoreService);
    /* @ngInject */
    function StoreService(geoLocation, httpClient) {
        var _current = null;
        var service = { getCurrentStore: _getCurrentStore };
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
                    }
                    return _current;
                });
            });
        }
    }
    StoreService.$inject = ["geoLocation", "httpClient"];
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
            $rootScope;
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
    angular.module('qarin').config(_configureHttp);
    /* @ngInject */
    function _configureHttp(httpClientProvider, env) {
        httpClientProvider.baseUri = env.apiRoot;
        httpClientProvider.authTokenName = 'token';
        httpClientProvider.authTokenType = 'Bearer';
    }
    _configureHttp.$inject = ["httpClientProvider", "env"];
}());
(function () {
    'use strict';
    angular.module('qarin').constant('env', { apiRoot: 'http://localhost:3000' });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbG9jYXRvci5jb250cm9sbGVyLmpzIiwiYXJlYXMvaG9tZS9Ib21lQ29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvY2hhdGxpc3QuY29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvY2hhdC5zZXJ2aWNlLmpzIiwiYXJlYXMvY2hhdC9DaGF0Q29udHJvbGxlci5qcyIsInNlcnZpY2VzL3N0b3JlU2VydmljZS5qcyIsInNlcnZpY2VzL3NvY2tldHMuanMiLCJzZXJ2aWNlcy9ub3RpZmljYXRpb24uc2VydmljZS5qcyIsInNlcnZpY2VzL2dlb0xvY2F0aW9uU2VydmljZS5qcyIsImNvbmZpZy9odHRwLmpzIiwiY29uZmlnL2Vudmlyb25tZW50LmpzIl0sIm5hbWVzIjpbImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCJwdXNoIiwic3RhdGUiLCJ1cmwiLCJhYnN0cmFjdCIsInZpZXdzIiwidGVtcGxhdGVVcmwiLCJub3RpZmljYXRpb25zIiwiY29udHJvbGxlciIsInBhcmVudCIsInRlbXBsYXRlIiwiY29udHJvbGxlckFzIiwicmVzb2x2ZSIsImNoYXRJZCIsIiRzdGF0ZVBhcmFtcyIsImlkIiwicnVuIiwiJHJvb3RTY29wZSIsIiRvbiIsImV2ZW50IiwidW5mb3VuZFN0YXRlIiwiZnJvbVN0YXRlIiwiZnJvbVBhcmFtcyIsImNvbnNvbGUiLCJsb2ciLCJ0byIsInRvUGFyYW1zIiwib3B0aW9ucyIsImZhY3RvcnkiLCIkcSIsInN0b3JhZ2VTZXJ2aWNlIiwicmVxdWVzdCIsImhlYWRlcnMiLCJnZXQiLCIkc2NvcGUiLCJzb2NrZXQiLCJjdXJyZW50Iiwib24iLCJkYXRhIiwiTG9jYXRvckNvbnRyb2xsZXIiLCJzdG9yZVNlcnZpY2UiLCJIb21lQ29udHJvbGxlciIsIiRodHRwIiwiZW52IiwicmVxdWVzdEhlbHAiLCJlbWl0Iiwic3RvcmVfaWQiLCJfaWQiLCJzZWFyY2hpbmciLCJzZWFyY2hFcnJvciIsImdldEN1cnJlbnRTdG9yZSIsInRoZW4iLCJzdG9yZSIsImNhdGNoIiwiZXgiLCJmaW5hbGx5IiwiQ2hhdExpc3RDb250cm9sbGVyIiwiaHR0cENsaWVudCIsInZtIiwiZXh0ZW5kIiwiY2hhdHMiLCJvcHRzIiwicGFyYW1zIiwicmVzIiwicGFyc2UiLCJtYXAiLCJ4IiwiQ2hhdCIsIm15RGV2aWNlSWQiLCJvdGhlcnMiLCJwYXJ0aWNpcGFudHMiLCJmb3JFYWNoIiwiZGV2aWNlIiwiZmlyc3ROYW1lIiwidXNlcnMiLCJqb2luIiwibGFzdE1lc3NhZ2UiLCJtZXNzYWdlcyIsInNsaWNlIiwiQ2hhdEZhY3RvcnkiLCJzZXJ2aWNlIiwic2VuZE1lc3NhZ2UiLCJpbml0IiwibWVzc2FnZSIsInBvc3QiLCIkZW1pdCIsImNoYXRTZXJ2aWNlIiwiY2hhdCIsInNlbmQiLCJlIiwibXNnIiwiU3RvcmVTZXJ2aWNlIiwiZ2VvTG9jYXRpb24iLCJfY3VycmVudCIsIl9nZXRDdXJyZW50U3RvcmUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJnZXRHcHMiLCJncHMiLCJsYXQiLCJjb29yZHMiLCJsYXRpdHVkZSIsImxuZyIsImxvbmdpdHVkZSIsInJlc3BvbnNlIiwibGVuZ3RoIiwic29ja2V0RmFjdG9yeSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJ1cmkiLCJhcGlSb290IiwiZGV2aWNlSWQiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwicXVlcnkiLCJteVNvY2tldCIsImlvU29ja2V0Iiwic29ja2V0QnVpbGRlciIsIk5vdGlmaWNhdGlvblNlcnZpY2UiLCJHZW9Mb2NhdGlvblNlcnZpY2UiLCIkd2luZG93Iiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCJwb3MiLCIkYXBwbHkiLCJjb2RlIiwicHJvbWlzZSIsIl9jb25maWd1cmVIdHRwIiwiaHR0cENsaWVudFByb3ZpZGVyIiwiYmFzZVVyaSIsImF1dGhUb2tlbk5hbWUiLCJhdXRoVG9rZW5UeXBlIiwiY29uc3RhbnQiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsWUFBWTtJQUNUO0lBQUpBLFFBQVFDLE9BQU8sU0FBUztRQUNwQjtRQUNBO1FBQ0E7UUFDQTtPQUlIQywyQ0FBTyxVQUFVQyxnQkFBZ0JDLGVBQWU7UUFFakRBLGNBQWNDLGFBQWFDLEtBQUs7UUFFNUJILGVBQ0tJLE1BQU0sUUFBUTtZQUNYQyxLQUFLO1lBQ0xDLFVBQVU7WUFDVkMsT0FBTztnQkFDSCxJQUFJOztvQkFFQUMsYUFBYTs7Z0JBRWpCQyxlQUFlO29CQUNYQyxZQUFZO29CQUNaRixhQUFhOzs7V0FJeEJKLE1BQU0sVUFBVTtZQUNiQyxLQUFLO1lBQ0xNLFFBQVE7WUFDUkwsVUFBVTtZQUNWTSxVQUFVO1dBRWJSLE1BQU0sUUFBUTtZQUNYQyxLQUFLO1lBQ0xNLFFBQVE7WUFDUkgsYUFBYTtZQUNiRSxZQUFZO1dBRWZOLE1BQU0sYUFBYTtZQUNoQkMsS0FBSztZQUNMTSxRQUFRO1lBQ1JILGFBQWE7WUFDYkUsWUFBWTtZQUNaRyxjQUFjO1dBRWpCVCxNQUFNLFFBQVE7WUFDWEMsS0FBSztZQUNMTSxRQUFRO1lBQ1JILGFBQWE7WUFDYkUsWUFBWTtZQUNaRyxjQUFjO1lBQ2RDLFNBQVM7Z0JBQ0xDLHlCQUFRLFVBQVNDLGNBQWE7b0JBQzFCLE9BQU9BLGFBQWFDOzs7OztJQU14Q3BCLFFBQVFDLE9BQU8sU0FDZG9CLG1CQUFJLFVBQVVDLFlBQVk7UUFFdkJBLFdBQVdDLElBQUksa0JBQWtCLFVBQVVDLE9BQU9DLGNBQWNDLFdBQVdDLFlBQVk7WUFDbkZDLFFBQVFDLElBQUlKLGFBQWFLOztZQUN6QkYsUUFBUUMsSUFBSUosYUFBYU07O1lBQ3pCSCxRQUFRQyxJ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QUNuQixPQUFPakcsR0FBR2tHLE9BQU87WUFFckIsSUFBSUMsUUFBUW5HLEdBQUdtRztZQUNmTixRQUFRRyxVQUFVQyxZQUFZRyxtQkFBbUIsVUFBVUMsS0FBSztnQkFDNURqSCxXQUFXa0gsT0FBTyxZQUFZO29CQUFFSCxNQUFNcEgsUUFBUXNIOztlQUMvQyxVQUFVNUUsSUFBSTtnQkFFYnJDLFdBQVdrSCxPQUFPLFlBQVk7b0JBRTFCLFFBQVE3RSxHQUFHOEU7b0JBQ1AsS0FBSzt3QkFBRyxPQUFPSixNQUFNRCxPQUFPO29CQUM1QixLQUFLO3dCQUFHLE9BQU9DLE1BQU1ELE9BQU87b0JBQzVCLEtBQUs7d0JBQUcsT0FBT0MsTUFBTUQsT0FBTztvQkFDNUI7d0JBQVMsT0FBT0MsTUFBTUQsT0FBTzs7OztZQUt6QyxPQUFPQyxNQUFNSzs7OztLQURoQjtBQ2hDTCxDQUFDLFlBQVk7SUFDVDtJQURKMUksUUFBUUMsT0FBTyxTQUNkQyxPQUFPeUk7O0lBR1IsU0FBU0EsZUFBZUMsb0JBQW9CNUYsS0FBSztRQUM3QzRGLG1CQUFtQkMsVUFBVTdGLElBQUlvRTtRQUNqQ3dCLG1CQUFtQkUsZ0JBQWdCO1FBQ25DRixtQkFBbUJHLGdCQUFnQjs7O0tBRWxDO0FDVEwsQ0FBQyxZQUFZO0lBQ1Q7SUFESi9JLFFBQVFDLE9BQU8sU0FDZCtJLFNBQVMsT0FBTyxFQUNiNUIsU0FBUztLQUNSIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4nLCBbICAgIFxyXG4gICAgJ3N5bWJpb3RlLmNvbW1vbicsXHJcbiAgICAncWFyaW4ucGFydGlhbHMnLFxyXG4gICAgJ3VpLnJvdXRlcicsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbydcclxuICAgIF0pXHJcblxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICRodHRwUHJvdmlkZXIpIHtcclxuICAgIFxyXG4kaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdkZXZpY2VJbnRlcmNlcHRvcicpO1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyXHJcbiAgICAgICAgLnN0YXRlKCdyb290Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdmlld3M6IHtcclxuICAgICAgICAgICAgICAgICcnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9jb250cm9sbGVyOiAnUm9vdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2xheW91dC9sYXlvdXQuaHRtbCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ05vdGlmaWNhdGlvbnNDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9ub3RpZmljYXRpb25zL25vdGlmaWNhdGlvbnMuaHRtbCdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0YXRlKCdsYXlvdXQnLCB7XHJcbiAgICAgICAgICAgIHVybDogJycsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ3Jvb3QnLFxyXG4gICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgdGVtcGxhdGU6ICc8dWktdmlldz48L3VpLXZpZXc+J1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0YXRlKCdob21lJywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdsYXlvdXQnLFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9ob21lL2hvbWUuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdC1saXN0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcvY2hhdCcsXHJcbiAgICAgICAgICAgIHBhcmVudDogJ2xheW91dCcsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FyZWFzL2NoYXQvY2hhdGxpc3QuaHRtbCcsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDaGF0TGlzdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnY2hhdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnL2NoYXQvOmlkJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bScsXHJcbiAgICAgICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgICAgIGNoYXRJZDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHN0YXRlUGFyYW1zLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn0pO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSkge1xyXG5cclxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVOb3RGb3VuZCcsIGZ1bmN0aW9uIChldmVudCwgdW5mb3VuZFN0YXRlLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUudG8pOyAvLyBcImxhenkuc3RhdGVcIlxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50b1BhcmFtcyk7IC8vIHthOjEsIGI6Mn1cclxuICAgICAgICBjb25zb2xlLmxvZyh1bmZvdW5kU3RhdGUub3B0aW9ucyk7IC8vIHtpbmhlcml0OmZhbHNlfSArIGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4uZmFjdG9yeSgnZGV2aWNlSW50ZXJjZXB0b3InLCBmdW5jdGlvbigkcSwgc3RvcmFnZVNlcnZpY2Upe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpe1xyXG5cclxuICAgICAgICAgICAgaWYoIWNvbmZpZyB8fCAhY29uZmlnLmhlYWRlcnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG5cclxuICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbJ3gtZGV2aWNlJ10gPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb250cm9sbGVyKCdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIHNvY2tldCkge1xyXG5cclxuICAgICRzY29wZS5jdXJyZW50ID0ge307XHJcbiAgICAvL25vdGlmaWNhdGlvblNvY2tldFxyXG4gICAgc29ja2V0Lm9uKCdoZWxwJywgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAkc2NvcGUuY3VycmVudCA9IGRhdGE7XHJcbiAgICB9KTtcclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5jb250cm9sbGVyKCdMb2NhdG9yQ29udHJvbGxlcicsIExvY2F0b3JDb250cm9sbGVyKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBMb2NhdG9yQ29udHJvbGxlcigkc2NvcGUsIHN0b3JlU2VydmljZSkge1xyXG5cclxuICAgIFxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBIb21lQ29udHJvbGxlcik7XHJcblxyXG5mdW5jdGlvbiBIb21lQ29udHJvbGxlcigkc2NvcGUsICRodHRwLCBlbnYsIHNvY2tldCwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgJHNjb3BlLnJlcXVlc3RIZWxwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vbm90aWZpY2F0aW9uU29ja2V0XHJcbiAgICAgICAgc29ja2V0LmVtaXQoJ2hlbHAtcmVxdWVzdGVkJywge3N0b3JlX2lkOiBzdG9yZVNlcnZpY2UuY3VycmVudC5faWR9KTtcclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLnNlYXJjaGluZyA9IHRydWU7XHJcbiAgICAkc2NvcGUuc2VhcmNoRXJyb3IgPSBcIlwiO1xyXG5cclxuICAgIHN0b3JlU2VydmljZS5nZXRDdXJyZW50U3RvcmUoKS50aGVuKGZ1bmN0aW9uKHN0b3JlKXtcclxuICAgICAgICAkc2NvcGUuc3RvcmUgPSBzdG9yZTtcclxuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChleCkge1xyXG4gICAgICAgICRzY29wZS5zZWFyY2hFcnJvciA9IGV4O1xyXG4gICAgfSkuZmluYWxseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHNjb3BlLnNlYXJjaGluZyA9IGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuXHQuY29udHJvbGxlcignQ2hhdExpc3RDb250cm9sbGVyJywgQ2hhdExpc3RDb250cm9sbGVyKTtcclxuXHJcbi8vIEBuZ0luamVjdFxyXG5mdW5jdGlvbiBDaGF0TGlzdENvbnRyb2xsZXIoaHR0cENsaWVudCwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG5cdHZhciB2bSA9IGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHtcclxuXHRcdGNoYXRzOiBudWxsXHJcblx0fSk7XHJcblxyXG5cclxuXHR2YXIgb3B0cyA9IHtcclxuXHRcdHBhcmFtczoge1xyXG5cdFx0XHRzdG9yZTogc3RvcmVTZXJ2aWNlLmN1cnJlbnQuaWRcclxuXHRcdH0sXHJcblx0XHRoZWFkZXJzOiB7XHJcblx0XHRcdCd4LWRldmljZSc6ICdkZXYtMSdcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRodHRwQ2xpZW50LmdldCgnL3VzZXJzL21lL2NoYXRzJywgb3B0cylcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHR2bS5jaGF0cyA9IHBhcnNlKHJlcy5kYXRhKTtcclxuXHRcdH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZShkYXRhKSB7XHJcblxyXG5cdHJldHVybiBkYXRhLm1hcChmdW5jdGlvbih4KSB7XHJcblx0XHRyZXR1cm4gbmV3IENoYXQoeCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENoYXQoZGF0YSkge1xyXG5cclxuXHQvLyBjb3B5IHJhdyBwcm9wZXJ0aWVzXHJcblx0YW5ndWxhci5leHRlbmQodGhpcywgZGF0YSk7XHJcblxyXG5cdHZhciBteURldmljZUlkID0gJ2Rldi0xJztcclxuXHR2YXIgb3RoZXJzID0gW107XHJcblxyXG5cdGRhdGEucGFydGljaXBhbnRzLmZvckVhY2goZnVuY3Rpb24oeCkge1xyXG5cdFx0aWYgKHguZGV2aWNlID09PSBteURldmljZUlkKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0b3RoZXJzLnB1c2goeC5maXJzdE5hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnVzZXJzID0gb3RoZXJzLmpvaW4oJywgJyk7XHJcblxyXG5cdHRoaXMubGFzdE1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2VzLnNsaWNlKC0xKVswXTtcclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG5cdC5mYWN0b3J5KCdjaGF0U2VydmljZScsIENoYXRGYWN0b3J5KTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBDaGF0RmFjdG9yeSgkcm9vdFNjb3BlLCBodHRwQ2xpZW50LCBzb2NrZXQpIHtcclxuXHJcblx0dmFyIHNlcnZpY2UgPSB7XHJcblx0XHRzZW5kTWVzc2FnZTogc2VuZE1lc3NhZ2UsXHJcblx0fVxyXG5cclxuXHRpbml0KCk7XHJcblxyXG5cdHJldHVybiBzZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShpZCwgbWVzc2FnZSkge1xyXG5cclxuXHRcdHZhciB1cmwgPSAnL2NoYXQvJyArIGlkICsgJy9tZXNzYWdlcyc7XHJcblx0XHRyZXR1cm4gaHR0cENsaWVudC5wb3N0KHVybCwge21lc3NhZ2U6IG1lc3NhZ2V9LHt9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaW5pdCgpe1xyXG5cdFx0c29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cdFx0XHQkcm9vdFNjb3BlLiRlbWl0KCdjaGF0LW1lc3NhZ2UnLCBkYXRhKTtcclxuXHRcdH0pO1xyXG5cdH1cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcblx0LmNvbnRyb2xsZXIoJ0NoYXRDb250cm9sbGVyJywgZnVuY3Rpb24oc29ja2V0LCBzdG9yZVNlcnZpY2UsIGNoYXRJZCwgaHR0cENsaWVudCwgJHJvb3RTY29wZSwgY2hhdFNlcnZpY2UpIHtcclxuXHJcblx0XHR2YXIgdm0gPSBhbmd1bGFyLmV4dGVuZCh0aGlzLCB7XHJcblx0XHRcdGNoYXQ6IG51bGwsXHJcblx0XHRcdHNlbmQ6IHNlbmRNZXNzYWdlLFxyXG5cdFx0XHRtZXNzYWdlOiAnJ1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0aHR0cENsaWVudC5nZXQoJy9jaGF0LycgKyBjaGF0SWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlcykge1xyXG5cdFx0XHRcdHZtLmNoYXQgPSByZXMuZGF0YTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0JHJvb3RTY29wZS4kb24oJ2NoYXQtbWVzc2FnZScsIGZ1bmN0aW9uKGUsIG1zZykge1xyXG5cdFx0XHR2bS5jaGF0Lm1lc3NhZ2VzLnB1c2gobXNnKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKCkge1xyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHZtLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgIHZtLm1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgICAgIGNoYXRTZXJ2aWNlLnNlbmRNZXNzYWdlKGNoYXRJZCwgbWVzc2FnZSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24obXNnKXtcclxuICAgICAgICAgICAgICAgIHZtLmNoYXQubWVzc2FnZXMucHVzaCh7bWVzc2FnZTogbWVzc2FnZX0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcblx0XHRcdC8vIGh0dHBDbGllbnQucG9zdCgnL2NoYXQvJyArIGNoYXRJZCArICcvbWVzc2FnZXMnLCB7XHJcblx0XHRcdC8vIFx0XHRtZXNzYWdlOiB2bS5tZXNzYWdlXHJcblx0XHRcdC8vIFx0fSlcclxuXHRcdFx0Ly8gXHQudGhlbihmdW5jdGlvbihyZXMpIHtcclxuXHRcdFx0Ly8gXHRcdGNvbnNvbGUubG9nKHJlcyk7XHJcblx0XHRcdC8vIFx0XHR2bS5tZXNzYWdlID0gJyc7XHJcblx0XHRcdC8vIFx0fSk7XHJcblx0XHR9XHJcblxyXG5cclxuXHJcblx0XHQvLyB2YXIgbWUgPSB0aGlzO1xyXG5cclxuXHRcdC8vIHNvY2tldC5vbignaW5pdCcsIGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHQvLyAgICAgbWUubmFtZSA9IGRhdGEubmFtZTtcclxuXHRcdC8vIH0pXHJcblxyXG5cdFx0Ly8gY2hhdFNvY2tldC5vbignY2hhdCcsIGZ1bmN0aW9uIChtc2cpIHtcclxuXHRcdC8vICAgICBtZS5tZXNzYWdlcy5wdXNoKG1zZyk7XHJcblx0XHQvLyB9KVxyXG5cdFx0Ly8gdGhpcy5tZXNzYWdlcyA9IFtdO1xyXG5cclxuXHRcdC8vIHRoaXMubmFtZSA9IFwiXCI7XHJcblx0XHQvLyB0aGlzLm1lc3NhZ2UgPSBcIlwiO1xyXG5cdFx0Ly8gdGhpcy5zZW5kID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gICAgIGNoYXRTb2NrZXQuZW1pdCgnY2hhdCcsIHRoaXMubWVzc2FnZSk7XHJcblx0XHQvLyB9XHJcblxyXG5cdH0pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbiAgICAuZmFjdG9yeSgnc3RvcmVTZXJ2aWNlJywgU3RvcmVTZXJ2aWNlKTtcclxuXHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gU3RvcmVTZXJ2aWNlKGdlb0xvY2F0aW9uLCBodHRwQ2xpZW50KSB7XHJcblxyXG4gICAgdmFyIF9jdXJyZW50ID0gbnVsbDtcclxuXHJcbiAgICB2YXIgc2VydmljZSA9IHsgICAgICAgIFxyXG4gICAgICAgIGdldEN1cnJlbnRTdG9yZTogX2dldEN1cnJlbnRTdG9yZSwgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VydmljZSwgJ2N1cnJlbnQnLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfY3VycmVudDsgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc2VydmljZTtcclxuXHJcbiAgICBmdW5jdGlvbiBfZ2V0Q3VycmVudFN0b3JlKCkge1xyXG5cclxuICAgICAgICByZXR1cm4gZ2VvTG9jYXRpb24uZ2V0R3BzKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGdwcykge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF0OiBncHMuY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxuZzogZ3BzLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHBDbGllbnQuZ2V0KCcvbG9jYXRpb25zJywgeyBwYXJhbXM6IHBhcmFtcyB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5sZW5ndGggPj0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2N1cnJlbnQgPSByZXNwb25zZS5kYXRhWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfY3VycmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzb2NrZXRCdWlsZGVyJywgZnVuY3Rpb24gKHNvY2tldEZhY3RvcnksIGVudiwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcbiAgICAgICAgdmFyIGJ1aWxkZXIgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICAgICAgICAgIGlmKG5hbWVzcGFjZSlcclxuICAgICAgICAgICAgICAgIHVyaSArPSBuYW1lc3BhY2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGV2aWNlSWQgPSBzdG9yYWdlU2VydmljZS5nZXQoJ2RldmljZScpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15SW9Tb2NrZXQgPSBpby5jb25uZWN0KHVyaSwge1xyXG4gICAgICAgICAgICAgICAgcXVlcnk6ICdkZXZpY2U9JyArIGRldmljZUlkXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcbiAgICAuZmFjdG9yeSgnc29ja2V0JywgZnVuY3Rpb24oc29ja2V0QnVpbGRlcikge1xyXG4gICAgICAgIHJldHVybiBzb2NrZXRCdWlsZGVyKCk7XHJcbiAgICB9KTtcclxuICAgICIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5mYWN0b3J5KCdub3RpZmljYXRpb25TZXJ2aWNlJywgTm90aWZpY2F0aW9uU2VydmljZSk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gTm90aWZpY2F0aW9uU2VydmljZSgkcm9vdFNjb3BlLCBzb2NrZXRCdWlsZGVyKXtcclxuXHJcblx0dmFyIHNvY2tldCA9IHNvY2tldEJ1aWxkZXIoJycpO1xyXG5cclxuXHRzb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihkYXRhKXtcclxuXHRcdCRyb290U2NvcGVcclxuXHR9KVxyXG5cclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5mYWN0b3J5KCdnZW9Mb2NhdGlvbicsIEdlb0xvY2F0aW9uU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gR2VvTG9jYXRpb25TZXJ2aWNlKCRxLCAkd2luZG93LCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgdmFyIHdhdGNoZXJDb3VudCA9IDA7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRHcHM6IF9jdXJyZW50UG9zaXRpb24sXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KVxyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChleCkge1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXguY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGRlZmVyLnJlamVjdCgnUGVybWlzc2lvbiBEZW5pZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBkZWZlci5yZWplY3QoJ1Bvc2l0aW9uIFVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVmZXIucmVqZWN0KCdUaW1lb3V0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGRlZmVyLnJlamVjdCgnVW5rb3duJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbmZpZyhfY29uZmlndXJlSHR0cCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gX2NvbmZpZ3VyZUh0dHAoaHR0cENsaWVudFByb3ZpZGVyLCBlbnYpIHtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICBodHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuTmFtZSA9IFwidG9rZW5cIjtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5UeXBlID0gXCJCZWFyZXJcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9