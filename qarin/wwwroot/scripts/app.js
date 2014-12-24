(function () {
    'use strict';
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str) {
            return this.slice(0, str.length) == str;
        };
    }
    if (typeof String.prototype.endsWith != 'function') {
        String.prototype.endsWith = function (str) {
            return this.slice(-str.length) == str;
        };
    }
    if (typeof String.prototype.snakeCase != 'function') {
        String.prototype.snakeCase = function (separator) {
            var SNAKE_CASE_REGEXP = /[A-Z]/g;
            separator = separator || '-';
            return this.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
                return (pos ? separator : '') + letter.toLowerCase();
            });
        };
    }
    if (typeof String.prototype.contains != 'function') {
        String.prototype.contains = function (substring) {
            return this.indexOf(substring) !== -1;
        };
    }
}());
(function () {
    'use strict';
    angular.module('genie.common', []);
}());
(function () {
    'use strict';
    angular.module('genie.common').factory('storageService', StorageService);
    /* @ngInject */
    function StorageService($window) {
        var _local = $window.localStorage;
        var _session = $window.sessionStorage;
        return {
            get: _get,
            set: _set,
            has: _has,
            remove: _remove
        };
        function _get(key) {
            var sessionValue = _session[key];
            if (_isSet(sessionValue))
                return _safeParse(sessionValue);
            var localValue = _local[key];
            if (_isSet(localValue))
                return _safeParse(localValue);
            return undefined;
        }
        function _set(key, value, persist) {
            if (_isUnset(value))
                return _remove(key);
            var store = !!persist ? _local : _session;
            var json = JSON.stringify(value);
            store.setItem(key, value);
        }
        function _remove(key) {
            delete _local[key];
            delete _session[key];
        }
        function _has(key) {
            return _isSet(_session[key]) || _isSet(_local[key]);
        }
        function _safeParse(jsonText) {
            if (jsonText === undefined || jsonText === null)
                return jsonText;
            if (typeof jsonText !== 'string')
                return jsonText;
            if (jsonText.length === 0)
                return jsonText;
            try {
                return JSON.parse(jsonText);
            } catch (e) {
                return jsonText;
            }
        }
        function _isUnset(value) {
            return value === undefined || value === null;
        }
        function _isSet(value) {
            return value !== undefined && value != null;
        }
    }
    StorageService.$inject = ["$window"];
}());
(function () {
    'use strict';
    angular.module('genie.common').provider('httpClient', HttpClientProvider);
    function HttpClientProvider() {
        this.baseUri = '';
        this.authTokenName = 'auth-token';
        this.authTokenType = 'Bearer';
        var provider = this;
        this.$get = HttpClient;
        /* @ngInject */
        function HttpClient($http, $q, $cacheFactory, storageService) {
            var service = {
                get: _get,
                post: _post,
                put: _put,
                delete: _delete,
                patch: _patch
            };
            return service;
            function _get(uri, config) {
                return _execute('GET', uri, null, config);
            }
            function _post(uri, data, config) {
                return _execute('POST', uri, data, config);
            }
            function _put(uri, data, config) {
                return _execute('PUT', uri, data, config);
            }
            function _delete(uri, config) {
                return _execute('DELETE', uri, null, config);
            }
            function _patch(uri, data, config) {
                return _execute('PATCH', uri, data, config);
            }
            function _execute(method, uri, data, config) {
                config = _extendConfig(config);
                var request = {
                    method: method,
                    url: _getAbsoluteUri(uri),
                    data: data
                };
                angular.extend(request, config);
                if (config.forceRefresh) {
                    var httpCache = $cacheFactory.get('$http');
                    httpCache.remove(fullUri);
                }
                return $http(request);    //console.log('GET ' + fullUri);
                                          //return $http.get(fullUri, config)
                                          //    .finally(function () {
                                          //        console.log('GET ' + fullUri + ' Complete');
                                          //    });
            }
            function _getAbsoluteUri(uri) {
                if (!provider.baseUri)
                    return uri;
                uri = uri || '';
                if (uri.startsWith('/') && provider.baseUri.endsWith('/'))
                    uri = uri.substring(1);
                return uri.indexOf('://', 0) < 0 ? provider.baseUri + uri : uri;
            }
            function _extendConfig(config) {
                if (!config)
                    return {};
                //TODO: Move the authentication token stuff into an interceptor
                if (config.auth) {
                    var authKey = '';
                    for (var scheme in config.auth) {
                        authKey += scheme + ' ' + config.auth[scheme] + ' ';
                    }
                    angular.extend(config, { headers: { Authorization: authKey } }, angular.copy(config));
                } else if (provider.authTokenName && provider.authTokenType) {
                    var token = storageService.get(provider.authTokenName);
                    if (token) {
                        angular.extend(config, { headers: { Authorization: provider.authTokenType + ' ' + token } }, angular.copy(config));
                    }
                }
                return config;
            }
        }
        HttpClient.$inject = ["$http", "$q", "$cacheFactory", "storageService"];
    }    //module CoreServices {
         //	export class HttpClientProvider implements ng.IServiceProvider {
         //	    private baseUri: string;
         //	    public setBaseUri(uri: string): void {
         //	        this.baseUri = uri;
         //	}
         //    /* @ngInject */
         //    public $get($http, storageService, $q, $cacheFactory): any {
         //        return new HttpClient($http, storageService, $q, $cacheFactory, this.baseUri);
         //    }
         //}
         //	export interface IHttpClient {
         //	    get(uri: string, config?: any): ng.IPromise<any>;
         //	    post(uri: string, data: any, config?: any): ng.IPromise<any>;
         //	    put(uri: string, data: any, config?: any): ng.IPromise<any>;
         //	    delete(uri: string, config?: any): ng.IPromise<any>;
         //	    patch(uri: string, data: any, config?: any): ng.IPromise<any>;
         //	}
         //	export class HttpClient implements IHttpClient {
         //	    // TODO: Move the token stuff to the authentication service
         //	    // TODO: Add interceptor for 401
         //	    public static AuthenticationTokenName: string = 'synergize-token';
         //	    private $http: ng.IHttpService;
         //	    private baseUri: string;
         //	    private localCache: CoreServices.IStorageService
         //	    private $cacheFactory: ng.ICacheFactoryService;
         //	    constructor($http: ng.IHttpService, storageService: CoreServices.IStorageService, $q, $cacheFactory: ng.ICacheFactoryService, uri) {
         //	        this.$http = $http;
         //	        this.baseUri = uri;
         //	        this.localCache = storageService;
         //	        this.$cacheFactory = $cacheFactory;
         //	    }
         //	    public get(uri: string, config?: any): ng.IPromise<any> {
         //	        config = config || {};
         //	    this.setAuthorizationHeaders(config);
         //	    var fullUri = this.getAbsoluteUri(uri);
         //	    if (config.forceRefresh) {
         //	        var httpCache = this.$cacheFactory.get('$http');
         //	        httpCache.remove(fullUri);
         //	    }
         //	    console.log('GET ' + fullUri);
         //	    return this.$http.get(fullUri, config)
         //            .finally(() => console.log('GET ' + fullUri + ' Complete'));
         //	}
         //public post(uri: string, data: any, config?: any): ng.IPromise<any> {
         //    config = config || {};
         //this.setAuthorizationHeaders(config);
         //var fullUri = this.getAbsoluteUri(uri);
         //return this.$http.post(fullUri, data, config);
         //}
         //public put(uri: string, data: any, config?: any): ng.IPromise<any> {
         //    return null;
         //}
         //public patch(uri: string, data: any, config?: any): ng.IPromise<any> {
         //    return null;
         //}
         //public delete(): ng.IPromise<any> {
         //    return null;
         //}
         ////#region Helpers
         //private getAbsoluteUri(uri: string): string {
         //    if (!this.baseUri)
         //        return uri;
         //    uri = uri || "";
         //    if (uri.startsWith('/') && this.baseUri.endsWith('/'))
         //        uri = uri.substring(1);
         //    return uri.indexOf('://', 0) < 0
         //        ? this.baseUri + uri
         //        : uri;
         //}
         //private setAuthorizationHeaders(config): void {
         //    //TODO: Move the authentication token stuff into an interceptor
         //    if (config.auth) {
         //				var authKey = '';
         //for (var scheme in config.auth) {
         //    authKey += scheme + ' ' + config.auth[scheme] + ' ';
         //}
         //angular.extend(config, { headers: { Authorization: authKey } }, angular.copy(config));				
         //} else {
         //    var token = this.localCache.get(HttpClient.AuthenticationTokenName);
         //    if (token) {
         //        angular.extend(config, { headers: { Authorization: 'SynergizeToken ' + token } }, angular.copy(config));
         //    }
         //}
         //}
         ////#endregion
         //}
         //} 
}());
(function () {
    'use strict';
    angular.module('qarin', [
        'genie.common',
        'qarin.partials',
        'ui.router',
        'btford.socket-io'
    ]).config(["$stateProvider", function ($stateProvider) {
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
        }).state('chat', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chat.html',
            controller: 'ChatController',
            controllerAs: 'vm'
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
}());
(function () {
    'use strict';
    angular.module('qarin').controller('NotificationsController', ["$scope", "notificationSocket", function ($scope, notificationSocket) {
        $scope.current = {};
        //notificationSocket
        notificationSocket.on('help', function (data) {
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
    function HomeController($scope, $http, env, notificationSocket, storeService) {
        $scope.requestHelp = function () {
            //notificationSocket
            notificationSocket.emit('help-requested', { store_id: storeService.current._id });
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
    HomeController.$inject = ["$scope", "$http", "env", "notificationSocket", "storeService"];
    ;
}());
(function () {
    'use strict';
    angular.module('qarin').controller('ChatController', ["chatSocket", function (chatSocket) {
        var me = this;
        chatSocket.on('init', function (data) {
            me.name = data.name;
        });
        chatSocket.on('chat', function (msg) {
            me.messages.push(msg);
        });
        this.messages = [];
        this.name = '';
        this.message = '';
        this.send = function () {
            chatSocket.emit('chat', this.message);
        };
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
    angular.module('qarin').factory('socketBuilder', ["socketFactory", "env", function (socketFactory, env) {
        var builder = function (namespace) {
            var myIoSocket = io.connect(env.apiRoot + namespace);
            var mySocket = socketFactory({ ioSocket: myIoSocket });
            return mySocket;
        };
        return builder;
    }]).factory('chatSocket', ["socketBuilder", function (socketBuilder) {
        return socketBuilder('/chat');
    }]).factory('notificationSocket', ["socketBuilder", function (socketBuilder) {
        return socketBuilder('/notifications');
    }]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2VzL2NvbW1vbi91dGlsLmpzIiwic2VydmljZXMvY29tbW9uL2dlbmllLmNvbW1vbi5tb2R1bGUuanMiLCJzZXJ2aWNlcy9jb21tb24vc3RvcmFnZVNlcnZpY2UuanMiLCJzZXJ2aWNlcy9jb21tb24vaHR0cENsaWVudC5qcyIsImFwcC5qcyIsImFyZWFzL25vdGlmaWNhdGlvbnMvTm90aWZpY2F0aW9uc0NvbnRyb2xsZXIuanMiLCJhcmVhcy9sYXlvdXQvbG9jYXRvci5jb250cm9sbGVyLmpzIiwiYXJlYXMvaG9tZS9Ib21lQ29udHJvbGxlci5qcyIsImFyZWFzL2NoYXQvQ2hhdENvbnRyb2xsZXIuanMiLCJzZXJ2aWNlcy9zdG9yZVNlcnZpY2UuanMiLCJzZXJ2aWNlcy9zb2NrZXRzLmpzIiwic2VydmljZXMvZ2VvTG9jYXRpb25TZXJ2aWNlLmpzIiwiY29uZmlnL2h0dHAuanMiLCJjb25maWcvZW52aXJvbm1lbnQuanMiXSwibmFtZXMiOlsiU3RyaW5nIiwicHJvdG90eXBlIiwic3RhcnRzV2l0aCIsInN0ciIsInNsaWNlIiwibGVuZ3RoIiwiZW5kc1dpdGgiLCJzbmFrZUNhc2UiLCJzZXBhcmF0b3IiLCJTTkFLRV9DQVNFX1JFR0VYUCIsInJlcGxhY2UiLCJsZXR0ZXIiLCJwb3MiLCJ0b0xvd2VyQ2FzZSIsImNvbnRhaW5zIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsImFuZ3VsYXIiLCJtb2R1bGUiLCJmYWN0b3J5IiwiU3RvcmFnZVNlcnZpY2UiLCIkd2luZG93IiwiX2xvY2FsIiwibG9jYWxTdG9yYWdlIiwiX3Nlc3Npb24iLCJzZXNzaW9uU3RvcmFnZSIsImdldCIsIl9nZXQiLCJzZXQiLCJfc2V0IiwiaGFzIiwiX2hhcyIsInJlbW92ZSIsIl9yZW1vdmUiLCJrZXkiLCJzZXNzaW9uVmFsdWUiLCJfaXNTZXQiLCJfc2FmZVBhcnNlIiwibG9jYWxWYWx1ZSIsInVuZGVmaW5lZCIsInZhbHVlIiwicGVyc2lzdCIsIl9pc1Vuc2V0Iiwic3RvcmUiLCJqc29uIiwiSlNPTiIsInN0cmluZ2lmeSIsInNldEl0ZW0iLCJqc29uVGV4dCIsInBhcnNlIiwiZSIsInByb3ZpZGVyIiwiSHR0cENsaWVudFByb3ZpZGVyIiwiYmFzZVVyaSIsImF1dGhUb2tlbk5hbWUiLCJhdXRoVG9rZW5UeXBlIiwiJGdldCIsIkh0dHBDbGllbnQiLCIkaHR0cCIsIiRxIiwiJGNhY2hlRmFjdG9yeSIsInN0b3JhZ2VTZXJ2aWNlIiwic2VydmljZSIsInBvc3QiLCJfcG9zdCIsInB1dCIsIl9wdXQiLCJkZWxldGUiLCJfZGVsZXRlIiwicGF0Y2giLCJfcGF0Y2giLCJ1cmkiLCJjb25maWciLCJfZXhlY3V0ZSIsImRhdGEiLCJtZXRob2QiLCJfZXh0ZW5kQ29uZmlnIiwicmVxdWVzdCIsInVybCIsIl9nZXRBYnNvbHV0ZVVyaSIsImV4dGVuZCIsImZvcmNlUmVmcmVzaCIsImh0dHBDYWNoZSIsImZ1bGxVcmkiLCJhdXRoIiwiYXV0aEtleSIsInNjaGVtZSIsImhlYWRlcnMiLCJBdXRob3JpemF0aW9uIiwiY29weSIsInRva2VuIiwiJHN0YXRlUHJvdmlkZXIiLCJzdGF0ZSIsImFic3RyYWN0Iiwidmlld3MiLCJ0ZW1wbGF0ZVVybCIsIm5vdGlmaWNhdGlvbnMiLCJjb250cm9sbGVyIiwicGFyZW50IiwidGVtcGxhdGUiLCJjb250cm9sbGVyQXMiLCJydW4iLCIkcm9vdFNjb3BlIiwiJG9uIiwiZXZlbnQiLCJ1bmZvdW5kU3RhdGUiLCJmcm9tU3RhdGUiLCJmcm9tUGFyYW1zIiwiY29uc29sZSIsImxvZyIsInRvIiwidG9QYXJhbXMiLCJvcHRpb25zIiwiJHNjb3BlIiwibm90aWZpY2F0aW9uU29ja2V0IiwiY3VycmVudCIsIm9uIiwiTG9jYXRvckNvbnRyb2xsZXIiLCJzdG9yZVNlcnZpY2UiLCJIb21lQ29udHJvbGxlciIsImVudiIsInJlcXVlc3RIZWxwIiwiZW1pdCIsInN0b3JlX2lkIiwiX2lkIiwic2VhcmNoaW5nIiwic2VhcmNoRXJyb3IiLCJnZXRDdXJyZW50U3RvcmUiLCJ0aGVuIiwiY2F0Y2giLCJleCIsImZpbmFsbHkiLCJjaGF0U29ja2V0IiwibWUiLCJuYW1lIiwibXNnIiwibWVzc2FnZXMiLCJwdXNoIiwibWVzc2FnZSIsInNlbmQiLCJTdG9yZVNlcnZpY2UiLCJnZW9Mb2NhdGlvbiIsImh0dHBDbGllbnQiLCJfY3VycmVudCIsIl9nZXRDdXJyZW50U3RvcmUiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImVudW1lcmFibGUiLCJnZXRHcHMiLCJncHMiLCJwYXJhbXMiLCJsYXQiLCJjb29yZHMiLCJsYXRpdHVkZSIsImxuZyIsImxvbmdpdHVkZSIsInJlc3BvbnNlIiwic29ja2V0RmFjdG9yeSIsImJ1aWxkZXIiLCJuYW1lc3BhY2UiLCJteUlvU29ja2V0IiwiaW8iLCJjb25uZWN0IiwiYXBpUm9vdCIsIm15U29ja2V0IiwiaW9Tb2NrZXQiLCJzb2NrZXRCdWlsZGVyIiwiR2VvTG9jYXRpb25TZXJ2aWNlIiwid2F0Y2hlckNvdW50IiwiX2N1cnJlbnRQb3NpdGlvbiIsIm5hdmlnYXRvciIsImdlb2xvY2F0aW9uIiwicmVqZWN0IiwiZGVmZXIiLCJnZXRDdXJyZW50UG9zaXRpb24iLCIkYXBwbHkiLCJyZXNvbHZlIiwiY29kZSIsInByb21pc2UiLCJfY29uZmlndXJlSHR0cCIsImh0dHBDbGllbnRQcm92aWRlciIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFlBQVk7SUFDVDtJQUFKLElBQUksT0FBT0EsT0FBT0MsVUFBVUMsY0FBYyxZQUFZO1FBQ2xERixPQUFPQyxVQUFVQyxhQUFhLFVBQVVDLEtBQUs7WUFDekMsT0FBTyxLQUFLQyxNQUFNLEdBQUdELElBQUlFLFdBQVdGOzs7SUFJNUMsSUFBSSxPQUFPSCxPQUFPQyxVQUFVSyxZQUFZLFlBQVk7UUFDaEROLE9BQU9DLFVBQVVLLFdBQVcsVUFBVUgsS0FBSztZQUN2QyxPQUFPLEtBQUtDLE1BQU0sQ0FBQ0QsSUFBSUUsV0FBV0Y7OztJQUkxQyxJQUFJLE9BQU9ILE9BQU9DLFVBQVVN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O0lBR3hCLFNBQVNBLG1CQUFtQjVHLElBQUl0QyxTQUFTaUYsWUFBWTtRQUVqRCxJQUFJa0UsZUFBZTtRQUVuQixPQUFPLEVBQ0hwQixRQUFRcUI7UUFHWixTQUFTQSxtQkFBbUI7WUFFeEIsSUFBSSxDQUFDcEosUUFBUXFKLFVBQVVDO2dCQUNuQixPQUFPaEgsR0FBR2lILE9BQU87WUFFckIsSUFBSUMsUUFBUWxILEdBQUdrSDtZQUNmeEosUUFBUXFKLFVBQVVDLFlBQVlHLG1CQUFtQixVQUFVbEssS0FBSztnQkFDNUQwRixXQUFXeUUsT0FBTyxZQUFZO29CQUFFRixNQUFNRyxRQUFRcEs7O2VBQy9DLFVBQVVzSCxJQUFJO2dCQUViNUIsV0FBV3lFLE9BQU8sWUFBWTtvQkFFMUIsUUFBUTdDLEdBQUcrQztvQkFDUCxLQUFLO3dCQUFHLE9BQU9KLE1BQU1ELE9BQU87b0JBQzVCLEtBQUs7d0JBQUcsT0FBT0MsTUFBTUQsT0FBTztvQkFDNUIsS0FBSzt3QkFBRyxPQUFPQyxNQUFNRCxPQUFPO29CQUM1Qjt3QkFBUyxPQUFPQyxNQUFNRCxPQUFPOzs7O1lBS3pDLE9BQU9DLE1BQU1LOzs7O0tBRGhCO0FDaENMLENBQUMsWUFBWTtJQUNUO0lBREpqSyxRQUFRQyxPQUFPLFNBQ2RzRCxPQUFPMkc7O0lBR1IsU0FBU0EsZUFBZUMsb0JBQW9CNUQsS0FBSztRQUM3QzRELG1CQUFtQi9ILFVBQVVtRSxJQUFJMkM7UUFDakNpQixtQkFBbUI5SCxnQkFBZ0I7UUFDbkM4SCxtQkFBbUI3SCxnQkFBZ0I7OztLQUVsQztBQ1RMLENBQUMsWUFBWTtJQUNUO0lBREp0QyxRQUFRQyxPQUFPLFNBQ2RtSyxTQUFTLE9BQU8sRUFDYmxCLFNBQVM7S0FDUiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaWYgKHR5cGVvZiBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGggIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoID0gZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIHN0ci5sZW5ndGgpID09IHN0cjtcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24gKHN0cikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNsaWNlKC1zdHIubGVuZ3RoKSA9PSBzdHI7XHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIFN0cmluZy5wcm90b3R5cGUuc25ha2VDYXNlICE9ICdmdW5jdGlvbicpIHtcclxuICAgIFN0cmluZy5wcm90b3R5cGUuc25ha2VDYXNlID0gZnVuY3Rpb24gKHNlcGFyYXRvcikge1xyXG4gICAgICAgIHZhciBTTkFLRV9DQVNFX1JFR0VYUCA9IC9bQS1aXS9nO1xyXG5cclxuICAgICAgICBzZXBhcmF0b3IgPSBzZXBhcmF0b3IgfHwgJy0nO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2UoU05BS0VfQ0FTRV9SRUdFWFAsIGZ1bmN0aW9uIChsZXR0ZXIsIHBvcykge1xyXG4gICAgICAgICAgICByZXR1cm4gKHBvcyA/IHNlcGFyYXRvciA6ICcnKSArIGxldHRlci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChzdWJzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHN1YnN0cmluZykgIT09IC0xO1xyXG4gICAgfVxyXG59XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdnZW5pZS5jb21tb24nLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2dlbmllLmNvbW1vbicpXHJcbi5mYWN0b3J5KCdzdG9yYWdlU2VydmljZScsIFN0b3JhZ2VTZXJ2aWNlKTtcclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yYWdlU2VydmljZSgkd2luZG93KSB7XHJcblxyXG4gICAgdmFyIF9sb2NhbCA9ICR3aW5kb3cubG9jYWxTdG9yYWdlO1xyXG4gICAgdmFyIF9zZXNzaW9uID0gJHdpbmRvdy5zZXNzaW9uU3RvcmFnZTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGdldDogX2dldCxcclxuICAgICAgICBzZXQ6IF9zZXQsXHJcbiAgICAgICAgaGFzOiBfaGFzLFxyXG4gICAgICAgIHJlbW92ZTogX3JlbW92ZVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gX2dldChrZXkpIHtcclxuXHJcbiAgICAgICAgdmFyIHNlc3Npb25WYWx1ZSA9IF9zZXNzaW9uW2tleV07XHJcbiAgICAgICAgaWYgKF9pc1NldChzZXNzaW9uVmFsdWUpKVxyXG4gICAgICAgICAgICByZXR1cm4gX3NhZmVQYXJzZShzZXNzaW9uVmFsdWUpO1xyXG5cclxuICAgICAgICB2YXIgbG9jYWxWYWx1ZSA9IF9sb2NhbFtrZXldO1xyXG4gICAgICAgIGlmIChfaXNTZXQobG9jYWxWYWx1ZSkpXHJcbiAgICAgICAgICAgIHJldHVybiBfc2FmZVBhcnNlKGxvY2FsVmFsdWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9zZXQoa2V5LCB2YWx1ZSwgcGVyc2lzdCkge1xyXG5cclxuICAgICAgICBpZiAoX2lzVW5zZXQodmFsdWUpKVxyXG4gICAgICAgICAgICByZXR1cm4gX3JlbW92ZShrZXkpO1xyXG5cclxuICAgICAgICB2YXIgc3RvcmUgPSAhIXBlcnNpc3QgPyBfbG9jYWwgOiBfc2Vzc2lvbjtcclxuICAgICAgICB2YXIganNvbiA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxuICAgICAgICBzdG9yZS5zZXRJdGVtKGtleSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9yZW1vdmUoa2V5KSB7XHJcbiAgICAgICAgZGVsZXRlIF9sb2NhbFtrZXldO1xyXG4gICAgICAgIGRlbGV0ZSBfc2Vzc2lvbltrZXldO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIF9oYXMoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIF9pc1NldChfc2Vzc2lvbltrZXldKSB8fCBfaXNTZXQoX2xvY2FsW2tleV0pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBfc2FmZVBhcnNlKGpzb25UZXh0KSB7XHJcbiAgICAgICAgaWYgKGpzb25UZXh0ID09PSB1bmRlZmluZWQgfHwganNvblRleHQgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiBqc29uVGV4dDtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBqc29uVGV4dCAhPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgcmV0dXJuIGpzb25UZXh0O1xyXG5cclxuICAgICAgICBpZiAoanNvblRleHQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4ganNvblRleHQ7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25UZXh0KTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29uVGV4dDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2lzVW5zZXQodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBfaXNTZXQodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPSBudWxsO1xyXG4gICAgfVxyXG59XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdnZW5pZS5jb21tb24nKVxyXG4gICAgLnByb3ZpZGVyKCdodHRwQ2xpZW50JywgSHR0cENsaWVudFByb3ZpZGVyKTtcclxuXHJcbmZ1bmN0aW9uIEh0dHBDbGllbnRQcm92aWRlcigpIHtcclxuICAgIFxyXG4gICAgdGhpcy5iYXNlVXJpID0gXCJcIjtcclxuICAgIHRoaXMuYXV0aFRva2VuTmFtZSA9IFwiYXV0aC10b2tlblwiO1xyXG4gICAgdGhpcy5hdXRoVG9rZW5UeXBlID0gXCJCZWFyZXJcIjtcclxuXHJcbiAgICB2YXIgcHJvdmlkZXIgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGdldCA9IEh0dHBDbGllbnQ7XHJcblxyXG4gICAgLyogQG5nSW5qZWN0ICovXHJcbiAgICBmdW5jdGlvbiBIdHRwQ2xpZW50KCRodHRwLCAkcSwgJGNhY2hlRmFjdG9yeSwgc3RvcmFnZVNlcnZpY2UpIHtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2UgPSB7XHJcbiAgICAgICAgICAgIGdldDogX2dldCxcclxuICAgICAgICAgICAgcG9zdDogX3Bvc3QsXHJcbiAgICAgICAgICAgIHB1dDogX3B1dCxcclxuICAgICAgICAgICAgZGVsZXRlOiBfZGVsZXRlLFxyXG4gICAgICAgICAgICBwYXRjaDogX3BhdGNoXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gc2VydmljZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX2dldCh1cmksIGNvbmZpZykgeyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gX2V4ZWN1dGUoJ0dFVCcsIHVyaSwgbnVsbCwgY29uZmlnKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9wb3N0KHVyaSwgZGF0YSwgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZXhlY3V0ZSgnUE9TVCcsIHVyaSwgZGF0YSwgY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9wdXQodXJpLCBkYXRhLCBjb25maWcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9leGVjdXRlKCdQVVQnLCB1cmksIGRhdGEsIGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfZGVsZXRlKHVyaSwgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZXhlY3V0ZSgnREVMRVRFJywgdXJpLCBudWxsLCBjb25maWcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gX3BhdGNoKHVyaSwgZGF0YSwgY29uZmlnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZXhlY3V0ZSgnUEFUQ0gnLCB1cmksIGRhdGEsIGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBfZXhlY3V0ZShtZXRob2QsIHVyaSwgZGF0YSwgY29uZmlnKSB7XHJcblxyXG4gICAgICAgICAgICBjb25maWcgPSBfZXh0ZW5kQ29uZmlnKGNvbmZpZyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgdXJsOiBfZ2V0QWJzb2x1dGVVcmkodXJpKSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuICBcclxuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQocmVxdWVzdCwgY29uZmlnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25maWcuZm9yY2VSZWZyZXNoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaHR0cENhY2hlID0gJGNhY2hlRmFjdG9yeS5nZXQoJyRodHRwJyk7XHJcbiAgICAgICAgICAgICAgICBodHRwQ2FjaGUucmVtb3ZlKGZ1bGxVcmkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAocmVxdWVzdCk7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdHRVQgJyArIGZ1bGxVcmkpO1xyXG4gICAgICAgICAgICAvL3JldHVybiAkaHR0cC5nZXQoZnVsbFVyaSwgY29uZmlnKVxyXG4gICAgICAgICAgICAvLyAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICBjb25zb2xlLmxvZygnR0VUICcgKyBmdWxsVXJpICsgJyBDb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAvLyAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9nZXRBYnNvbHV0ZVVyaSh1cmkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghcHJvdmlkZXIuYmFzZVVyaSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB1cmk7XHJcblxyXG4gICAgICAgICAgICB1cmkgPSB1cmkgfHwgXCJcIjtcclxuXHJcbiAgICAgICAgICAgIGlmICh1cmkuc3RhcnRzV2l0aCgnLycpICYmIHByb3ZpZGVyLmJhc2VVcmkuZW5kc1dpdGgoJy8nKSlcclxuICAgICAgICAgICAgICAgIHVyaSA9IHVyaS5zdWJzdHJpbmcoMSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdXJpLmluZGV4T2YoJzovLycsIDApIDwgMFxyXG4gICAgICAgICAgICAgICAgPyBwcm92aWRlci5iYXNlVXJpICsgdXJpXHJcbiAgICAgICAgICAgICAgICA6IHVyaTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIF9leHRlbmRDb25maWcoY29uZmlnKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWNvbmZpZylcclxuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcclxuXHJcbiAgICAgICAgICAgIC8vVE9ETzogTW92ZSB0aGUgYXV0aGVudGljYXRpb24gdG9rZW4gc3R1ZmYgaW50byBhbiBpbnRlcmNlcHRvclxyXG4gICAgICAgICAgICBpZiAoY29uZmlnLmF1dGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgYXV0aEtleSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc2NoZW1lIGluIGNvbmZpZy5hdXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0aEtleSArPSBzY2hlbWUgKyAnICcgKyBjb25maWcuYXV0aFtzY2hlbWVdICsgJyAnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgeyBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGF1dGhLZXkgfSB9LCBhbmd1bGFyLmNvcHkoY29uZmlnKSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3ZpZGVyLmF1dGhUb2tlbk5hbWUgJiYgcHJvdmlkZXIuYXV0aFRva2VuVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRva2VuID0gc3RvcmFnZVNlcnZpY2UuZ2V0KHByb3ZpZGVyLmF1dGhUb2tlbk5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCB7IGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogcHJvdmlkZXIuYXV0aFRva2VuVHlwZSArICcgJyArIHRva2VuIH0gfSwgYW5ndWxhci5jb3B5KGNvbmZpZykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vL21vZHVsZSBDb3JlU2VydmljZXMge1xyXG5cclxuLy9cdGV4cG9ydCBjbGFzcyBIdHRwQ2xpZW50UHJvdmlkZXIgaW1wbGVtZW50cyBuZy5JU2VydmljZVByb3ZpZGVyIHtcclxuXHJcbi8vXHQgICAgcHJpdmF0ZSBiYXNlVXJpOiBzdHJpbmc7XHJcbi8vXHQgICAgcHVibGljIHNldEJhc2VVcmkodXJpOiBzdHJpbmcpOiB2b2lkIHtcclxuLy9cdCAgICAgICAgdGhpcy5iYXNlVXJpID0gdXJpO1xyXG4vL1x0fVxyXG5cclxuLy8gICAgLyogQG5nSW5qZWN0ICovXHJcbi8vICAgIHB1YmxpYyAkZ2V0KCRodHRwLCBzdG9yYWdlU2VydmljZSwgJHEsICRjYWNoZUZhY3RvcnkpOiBhbnkge1xyXG4vLyAgICAgICAgcmV0dXJuIG5ldyBIdHRwQ2xpZW50KCRodHRwLCBzdG9yYWdlU2VydmljZSwgJHEsICRjYWNoZUZhY3RvcnksIHRoaXMuYmFzZVVyaSk7XHJcbi8vICAgIH1cclxuLy99XHJcblxyXG4vL1x0ZXhwb3J0IGludGVyZmFjZSBJSHR0cENsaWVudCB7XHJcblxyXG4vL1x0ICAgIGdldCh1cmk6IHN0cmluZywgY29uZmlnPzogYW55KTogbmcuSVByb21pc2U8YW55PjtcclxuLy9cdCAgICBwb3N0KHVyaTogc3RyaW5nLCBkYXRhOiBhbnksIGNvbmZpZz86IGFueSk6IG5nLklQcm9taXNlPGFueT47XHJcbi8vXHQgICAgcHV0KHVyaTogc3RyaW5nLCBkYXRhOiBhbnksIGNvbmZpZz86IGFueSk6IG5nLklQcm9taXNlPGFueT47XHJcbi8vXHQgICAgZGVsZXRlKHVyaTogc3RyaW5nLCBjb25maWc/OiBhbnkpOiBuZy5JUHJvbWlzZTxhbnk+O1xyXG5cclxuLy9cdCAgICBwYXRjaCh1cmk6IHN0cmluZywgZGF0YTogYW55LCBjb25maWc/OiBhbnkpOiBuZy5JUHJvbWlzZTxhbnk+O1xyXG4vL1x0fVxyXG5cclxuLy9cdGV4cG9ydCBjbGFzcyBIdHRwQ2xpZW50IGltcGxlbWVudHMgSUh0dHBDbGllbnQge1xyXG5cclxuLy9cdCAgICAvLyBUT0RPOiBNb3ZlIHRoZSB0b2tlbiBzdHVmZiB0byB0aGUgYXV0aGVudGljYXRpb24gc2VydmljZVxyXG4vL1x0ICAgIC8vIFRPRE86IEFkZCBpbnRlcmNlcHRvciBmb3IgNDAxXHJcbi8vXHQgICAgcHVibGljIHN0YXRpYyBBdXRoZW50aWNhdGlvblRva2VuTmFtZTogc3RyaW5nID0gJ3N5bmVyZ2l6ZS10b2tlbic7XHJcblxyXG4vL1x0ICAgIHByaXZhdGUgJGh0dHA6IG5nLklIdHRwU2VydmljZTtcclxuLy9cdCAgICBwcml2YXRlIGJhc2VVcmk6IHN0cmluZztcclxuLy9cdCAgICBwcml2YXRlIGxvY2FsQ2FjaGU6IENvcmVTZXJ2aWNlcy5JU3RvcmFnZVNlcnZpY2VcclxuLy9cdCAgICBwcml2YXRlICRjYWNoZUZhY3Rvcnk6IG5nLklDYWNoZUZhY3RvcnlTZXJ2aWNlO1xyXG5cclxuLy9cdCAgICBjb25zdHJ1Y3RvcigkaHR0cDogbmcuSUh0dHBTZXJ2aWNlLCBzdG9yYWdlU2VydmljZTogQ29yZVNlcnZpY2VzLklTdG9yYWdlU2VydmljZSwgJHEsICRjYWNoZUZhY3Rvcnk6IG5nLklDYWNoZUZhY3RvcnlTZXJ2aWNlLCB1cmkpIHtcclxuLy9cdCAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4vL1x0ICAgICAgICB0aGlzLmJhc2VVcmkgPSB1cmk7XHJcbi8vXHQgICAgICAgIHRoaXMubG9jYWxDYWNoZSA9IHN0b3JhZ2VTZXJ2aWNlO1xyXG4vL1x0ICAgICAgICB0aGlzLiRjYWNoZUZhY3RvcnkgPSAkY2FjaGVGYWN0b3J5O1xyXG4vL1x0ICAgIH1cclxuXHJcbi8vXHQgICAgcHVibGljIGdldCh1cmk6IHN0cmluZywgY29uZmlnPzogYW55KTogbmcuSVByb21pc2U8YW55PiB7XHJcbi8vXHQgICAgICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHJcbi8vXHQgICAgdGhpcy5zZXRBdXRob3JpemF0aW9uSGVhZGVycyhjb25maWcpO1xyXG5cclxuLy9cdCAgICB2YXIgZnVsbFVyaSA9IHRoaXMuZ2V0QWJzb2x1dGVVcmkodXJpKTtcclxuLy9cdCAgICBpZiAoY29uZmlnLmZvcmNlUmVmcmVzaCkge1xyXG4vL1x0ICAgICAgICB2YXIgaHR0cENhY2hlID0gdGhpcy4kY2FjaGVGYWN0b3J5LmdldCgnJGh0dHAnKTtcclxuLy9cdCAgICAgICAgaHR0cENhY2hlLnJlbW92ZShmdWxsVXJpKTtcclxuLy9cdCAgICB9XHJcblxyXG4vL1x0ICAgIGNvbnNvbGUubG9nKCdHRVQgJyArIGZ1bGxVcmkpO1xyXG4vL1x0ICAgIHJldHVybiB0aGlzLiRodHRwLmdldChmdWxsVXJpLCBjb25maWcpXHJcbi8vICAgICAgICAgICAgLmZpbmFsbHkoKCkgPT4gY29uc29sZS5sb2coJ0dFVCAnICsgZnVsbFVyaSArICcgQ29tcGxldGUnKSk7XHJcbi8vXHR9XHJcblxyXG4vL3B1YmxpYyBwb3N0KHVyaTogc3RyaW5nLCBkYXRhOiBhbnksIGNvbmZpZz86IGFueSk6IG5nLklQcm9taXNlPGFueT4ge1xyXG5cclxuLy8gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG4vL3RoaXMuc2V0QXV0aG9yaXphdGlvbkhlYWRlcnMoY29uZmlnKTtcclxuXHJcbi8vdmFyIGZ1bGxVcmkgPSB0aGlzLmdldEFic29sdXRlVXJpKHVyaSk7XHJcblxyXG4vL3JldHVybiB0aGlzLiRodHRwLnBvc3QoZnVsbFVyaSwgZGF0YSwgY29uZmlnKTtcclxuXHJcbi8vfVxyXG5cclxuLy9wdWJsaWMgcHV0KHVyaTogc3RyaW5nLCBkYXRhOiBhbnksIGNvbmZpZz86IGFueSk6IG5nLklQcm9taXNlPGFueT4ge1xyXG4vLyAgICByZXR1cm4gbnVsbDtcclxuLy99XHJcblxyXG4vL3B1YmxpYyBwYXRjaCh1cmk6IHN0cmluZywgZGF0YTogYW55LCBjb25maWc/OiBhbnkpOiBuZy5JUHJvbWlzZTxhbnk+IHtcclxuLy8gICAgcmV0dXJuIG51bGw7XHJcbi8vfVxyXG5cclxuLy9wdWJsaWMgZGVsZXRlKCk6IG5nLklQcm9taXNlPGFueT4ge1xyXG4vLyAgICByZXR1cm4gbnVsbDtcclxuLy99XHJcblxyXG4vLy8vI3JlZ2lvbiBIZWxwZXJzXHJcbi8vcHJpdmF0ZSBnZXRBYnNvbHV0ZVVyaSh1cmk6IHN0cmluZyk6IHN0cmluZyB7XHJcblxyXG4vLyAgICBpZiAoIXRoaXMuYmFzZVVyaSlcclxuLy8gICAgICAgIHJldHVybiB1cmk7XHJcblxyXG4vLyAgICB1cmkgPSB1cmkgfHwgXCJcIjtcclxuXHJcbi8vICAgIGlmICh1cmkuc3RhcnRzV2l0aCgnLycpICYmIHRoaXMuYmFzZVVyaS5lbmRzV2l0aCgnLycpKVxyXG4vLyAgICAgICAgdXJpID0gdXJpLnN1YnN0cmluZygxKTtcclxuXHJcbi8vICAgIHJldHVybiB1cmkuaW5kZXhPZignOi8vJywgMCkgPCAwXHJcbi8vICAgICAgICA/IHRoaXMuYmFzZVVyaSArIHVyaVxyXG4vLyAgICAgICAgOiB1cmk7XHJcbi8vfVxyXG5cclxuLy9wcml2YXRlIHNldEF1dGhvcml6YXRpb25IZWFkZXJzKGNvbmZpZyk6IHZvaWQge1xyXG5cclxuLy8gICAgLy9UT0RPOiBNb3ZlIHRoZSBhdXRoZW50aWNhdGlvbiB0b2tlbiBzdHVmZiBpbnRvIGFuIGludGVyY2VwdG9yXHJcbi8vICAgIGlmIChjb25maWcuYXV0aCkge1xyXG5cclxuLy9cdFx0XHRcdHZhciBhdXRoS2V5ID0gJyc7XHJcbi8vZm9yICh2YXIgc2NoZW1lIGluIGNvbmZpZy5hdXRoKSB7XHJcbi8vICAgIGF1dGhLZXkgKz0gc2NoZW1lICsgJyAnICsgY29uZmlnLmF1dGhbc2NoZW1lXSArICcgJztcclxuLy99XHJcblxyXG4vL2FuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgeyBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246IGF1dGhLZXkgfSB9LCBhbmd1bGFyLmNvcHkoY29uZmlnKSk7XHRcdFx0XHRcclxuXHJcbi8vfSBlbHNlIHtcclxuLy8gICAgdmFyIHRva2VuID0gdGhpcy5sb2NhbENhY2hlLmdldChIdHRwQ2xpZW50LkF1dGhlbnRpY2F0aW9uVG9rZW5OYW1lKTtcclxuLy8gICAgaWYgKHRva2VuKSB7XHJcbi8vICAgICAgICBhbmd1bGFyLmV4dGVuZChjb25maWcsIHsgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiAnU3luZXJnaXplVG9rZW4gJyArIHRva2VuIH0gfSwgYW5ndWxhci5jb3B5KGNvbmZpZykpO1xyXG4vLyAgICB9XHJcbi8vfVxyXG4vL31cclxuLy8vLyNlbmRyZWdpb25cclxuLy99XHJcbi8vfSAiLCJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJywgW1xyXG4gICAgJ2dlbmllLmNvbW1vbicsXHJcbiAgICAncWFyaW4ucGFydGlhbHMnLFxyXG4gICAgJ3VpLnJvdXRlcicsXHJcbiAgICAnYnRmb3JkLnNvY2tldC1pbyddKVxyXG5cclxuXHJcbi5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcbiAgICAkc3RhdGVQcm92aWRlclxyXG4gICAgICAgIC5zdGF0ZSgncm9vdCcsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHZpZXdzOiB7XHJcbiAgICAgICAgICAgICAgICAnJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vY29udHJvbGxlcjogJ1Jvb3RDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9hcmVhcy9sYXlvdXQvbGF5b3V0Lmh0bWwnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdOb3RpZmljYXRpb25zQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnbGF5b3V0Jywge1xyXG4gICAgICAgICAgICB1cmw6ICcnLFxyXG4gICAgICAgICAgICBwYXJlbnQ6ICdyb290JyxcclxuICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnPHVpLXZpZXc+PC91aS12aWV3PidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdGF0ZSgnaG9tZScsIHtcclxuICAgICAgICAgICAgdXJsOiAnJyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvaG9tZS9ob21lLmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3RhdGUoJ2NoYXQnLCB7XHJcbiAgICAgICAgICAgIHVybDogJy9jaGF0JyxcclxuICAgICAgICAgICAgcGFyZW50OiAnbGF5b3V0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJlYXMvY2hhdC9jaGF0Lmh0bWwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ2hhdENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICd2bSdcclxuICAgICAgICB9KTtcclxufSk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4ucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZU5vdEZvdW5kJywgZnVuY3Rpb24gKGV2ZW50LCB1bmZvdW5kU3RhdGUsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS50byk7IC8vIFwibGF6eS5zdGF0ZVwiXHJcbiAgICAgICAgY29uc29sZS5sb2codW5mb3VuZFN0YXRlLnRvUGFyYW1zKTsgLy8ge2E6MSwgYjoyfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKHVuZm91bmRTdGF0ZS5vcHRpb25zKTsgLy8ge2luaGVyaXQ6ZmFsc2V9ICsgZGVmYXVsdCBvcHRpb25zXHJcbiAgICB9KVxyXG59KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbnRyb2xsZXIoJ05vdGlmaWNhdGlvbnNDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbm90aWZpY2F0aW9uU29ja2V0KSB7XHJcblxyXG4gICAgJHNjb3BlLmN1cnJlbnQgPSB7fTtcclxuICAgIC8vbm90aWZpY2F0aW9uU29ja2V0XHJcbiAgICBub3RpZmljYXRpb25Tb2NrZXQub24oJ2hlbHAnLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICRzY29wZS5jdXJyZW50ID0gZGF0YTtcclxuICAgIH0pO1xyXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmNvbnRyb2xsZXIoJ0xvY2F0b3JDb250cm9sbGVyJywgTG9jYXRvckNvbnRyb2xsZXIpO1xyXG5cclxuLyogQG5nSW5qZWN0ICovXHJcbmZ1bmN0aW9uIExvY2F0b3JDb250cm9sbGVyKCRzY29wZSwgc3RvcmVTZXJ2aWNlKSB7XHJcblxyXG4gICAgXHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIEhvbWVDb250cm9sbGVyKTtcclxuXHJcbmZ1bmN0aW9uIEhvbWVDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGVudiwgbm90aWZpY2F0aW9uU29ja2V0LCBzdG9yZVNlcnZpY2UpIHtcclxuXHJcbiAgICAkc2NvcGUucmVxdWVzdEhlbHAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy9ub3RpZmljYXRpb25Tb2NrZXRcclxuICAgICAgICBub3RpZmljYXRpb25Tb2NrZXQuZW1pdCgnaGVscC1yZXF1ZXN0ZWQnLCB7c3RvcmVfaWQ6IHN0b3JlU2VydmljZS5jdXJyZW50Ll9pZH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuc2VhcmNoaW5nID0gdHJ1ZTtcclxuICAgICRzY29wZS5zZWFyY2hFcnJvciA9IFwiXCI7XHJcblxyXG4gICAgc3RvcmVTZXJ2aWNlLmdldEN1cnJlbnRTdG9yZSgpLnRoZW4oZnVuY3Rpb24oc3RvcmUpe1xyXG4gICAgICAgICRzY29wZS5zdG9yZSA9IHN0b3JlO1xyXG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGV4KSB7XHJcbiAgICAgICAgJHNjb3BlLnNlYXJjaEVycm9yID0gZXg7XHJcbiAgICB9KS5maW5hbGx5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkc2NvcGUuc2VhcmNoaW5nID0gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCJcclxuYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbnRyb2xsZXIoJ0NoYXRDb250cm9sbGVyJywgZnVuY3Rpb24gKGNoYXRTb2NrZXQpIHtcclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG5cclxuICAgIGNoYXRTb2NrZXQub24oJ2luaXQnLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIG1lLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB9KVxyXG5cclxuICAgIGNoYXRTb2NrZXQub24oJ2NoYXQnLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgbWUubWVzc2FnZXMucHVzaChtc2cpO1xyXG4gICAgfSlcclxuICAgIHRoaXMubWVzc2FnZXMgPSBbXTtcclxuXHJcbiAgICB0aGlzLm5hbWUgPSBcIlwiO1xyXG4gICAgdGhpcy5tZXNzYWdlID0gXCJcIjtcclxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjaGF0U29ja2V0LmVtaXQoJ2NoYXQnLCB0aGlzLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG5cclxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuICAgIC5mYWN0b3J5KCdzdG9yZVNlcnZpY2UnLCBTdG9yZVNlcnZpY2UpO1xyXG5cclxuXHJcbi8qIEBuZ0luamVjdCAqL1xyXG5mdW5jdGlvbiBTdG9yZVNlcnZpY2UoZ2VvTG9jYXRpb24sIGh0dHBDbGllbnQpIHtcclxuXHJcbiAgICB2YXIgX2N1cnJlbnQgPSBudWxsO1xyXG5cclxuICAgIHZhciBzZXJ2aWNlID0geyAgICAgICAgXHJcbiAgICAgICAgZ2V0Q3VycmVudFN0b3JlOiBfZ2V0Q3VycmVudFN0b3JlLCAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZXJ2aWNlLCAnY3VycmVudCcsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF9jdXJyZW50OyB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBzZXJ2aWNlO1xyXG5cclxuICAgIGZ1bmN0aW9uIF9nZXRDdXJyZW50U3RvcmUoKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBnZW9Mb2NhdGlvbi5nZXRHcHMoKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZ3BzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsYXQ6IGdwcy5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbG5nOiBncHMuY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cENsaWVudC5nZXQoJy9sb2NhdGlvbnMnLCB7IHBhcmFtczogcGFyYW1zIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmxlbmd0aCA+PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfY3VycmVudCA9IHJlc3BvbnNlLmRhdGFbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9jdXJyZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJhbmd1bGFyLm1vZHVsZSgncWFyaW4nKVxyXG4gICAgLmZhY3RvcnkoJ3NvY2tldEJ1aWxkZXInLCBmdW5jdGlvbiAoc29ja2V0RmFjdG9yeSwgZW52KSB7XHJcblxyXG4gICAgICAgIHZhciBidWlsZGVyID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG4gICAgICAgICAgICB2YXIgbXlJb1NvY2tldCA9IGlvLmNvbm5lY3QoZW52LmFwaVJvb3QgKyBuYW1lc3BhY2UpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG15U29ja2V0ID0gc29ja2V0RmFjdG9yeSh7XHJcbiAgICAgICAgICAgICAgICBpb1NvY2tldDogbXlJb1NvY2tldFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBteVNvY2tldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZGVyO1xyXG5cclxuICAgIH0pXHJcbiAgICAuZmFjdG9yeSgnY2hhdFNvY2tldCcsIGZ1bmN0aW9uIChzb2NrZXRCdWlsZGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoJy9jaGF0Jyk7ICAgICAgICBcclxuICAgIH0pXHJcbi5mYWN0b3J5KCdub3RpZmljYXRpb25Tb2NrZXQnLCBmdW5jdGlvbiAoc29ja2V0QnVpbGRlcikge1xyXG4gICAgcmV0dXJuIHNvY2tldEJ1aWxkZXIoJy9ub3RpZmljYXRpb25zJyk7ICAgXHJcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5mYWN0b3J5KCdnZW9Mb2NhdGlvbicsIEdlb0xvY2F0aW9uU2VydmljZSk7XHJcblxyXG4vLyBAbmdJbmplY3RcclxuZnVuY3Rpb24gR2VvTG9jYXRpb25TZXJ2aWNlKCRxLCAkd2luZG93LCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgdmFyIHdhdGNoZXJDb3VudCA9IDA7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRHcHM6IF9jdXJyZW50UG9zaXRpb24sXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIF9jdXJyZW50UG9zaXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghJHdpbmRvdy5uYXZpZ2F0b3IuZ2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoJ0dQUyBpcyBub3QgYXZhaWxhYmxlIG9uIHlvdXIgZGV2aWNlLicpO1xyXG5cclxuICAgICAgICB2YXIgZGVmZXIgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICR3aW5kb3cubmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihmdW5jdGlvbiAocG9zKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHsgZGVmZXIucmVzb2x2ZShwb3MpOyB9KVxyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChleCkge1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXguY29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGRlZmVyLnJlamVjdCgnUGVybWlzc2lvbiBEZW5pZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBkZWZlci5yZWplY3QoJ1Bvc2l0aW9uIFVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gZGVmZXIucmVqZWN0KCdUaW1lb3V0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGRlZmVyLnJlamVjdCgnVW5rb3duJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGRlZmVyLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG59IiwiYW5ndWxhci5tb2R1bGUoJ3FhcmluJylcclxuLmNvbmZpZyhfY29uZmlndXJlSHR0cCk7XHJcblxyXG4vKiBAbmdJbmplY3QgKi9cclxuZnVuY3Rpb24gX2NvbmZpZ3VyZUh0dHAoaHR0cENsaWVudFByb3ZpZGVyLCBlbnYpIHtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5iYXNlVXJpID0gZW52LmFwaVJvb3Q7XHJcbiAgICBodHRwQ2xpZW50UHJvdmlkZXIuYXV0aFRva2VuTmFtZSA9IFwidG9rZW5cIjtcclxuICAgIGh0dHBDbGllbnRQcm92aWRlci5hdXRoVG9rZW5UeXBlID0gXCJCZWFyZXJcIjtcclxufSIsImFuZ3VsYXIubW9kdWxlKCdxYXJpbicpXHJcbi5jb25zdGFudCgnZW52Jywge1xyXG4gICAgYXBpUm9vdDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCdcclxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9