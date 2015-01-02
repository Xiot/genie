angular.module('solomon',
    [
        'app.layout',
        'app.logging',
        'app.sections',
        'app.security',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'symbiote.common',
        'ngAnimate'
    ]);

angular.module('solomon')
.config(config);

/* @ngInject */
function config(httpClientProvider, $httpProvider){
	httpClientProvider.baseUri = "http://localhost:3000";

        $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.cache = true;
}