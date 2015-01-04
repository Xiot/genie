angular.module('solomon',
    [
        'app.layout',
        'app.logging',
        'app.sections',
        'app.security',
        'app.data',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'app.tasks',
        'app.employees',
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