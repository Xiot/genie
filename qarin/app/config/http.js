angular.module('qarin')
.config(_configureHttp);

/* @ngInject */
function _configureHttp(httpClientProvider, env) {
    httpClientProvider.baseUri = env.apiRoot;
    httpClientProvider.authTokenName = "token";
    httpClientProvider.authTokenType = "Bearer";
}