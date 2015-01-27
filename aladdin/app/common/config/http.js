angular.module('aladdin.config')
	.config(config);

/* @ngInject */
function config(httpClientProvider, $httpProvider, env) {
	httpClientProvider.baseUri = env.apiRoot;

	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.withCredentials = true;
	$httpProvider.defaults.cache = true;
}