angular.module('genie.common')
    .provider('httpClient', HttpClientProvider);

function HttpClientProvider() {
    
    this.baseUri = "";
    this.authTokenName = "auth-token";
    this.authTokenType = "Bearer";

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

            return $http(request);

            //console.log('GET ' + fullUri);
            //return $http.get(fullUri, config)
            //    .finally(function () {
            //        console.log('GET ' + fullUri + ' Complete');
            //    });
        }

        function _getAbsoluteUri(uri) {

            if (!provider.baseUri)
                return uri;

            uri = uri || "";

            if (uri.startsWith('/') && provider.baseUri.endsWith('/'))
                uri = uri.substring(1);

            return uri.indexOf('://', 0) < 0
                ? provider.baseUri + uri
                : uri;
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
}

//module CoreServices {

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