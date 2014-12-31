angular.module('solomon',
    [
        'app.layout',
        'app.logging',
        'app.sections',
        'solomon.partials',
        'app.dashboard',
        'app.stores',
        'symbiote.common'
    ]);

angular.module('solomon')
.config(config);

/* @ngInject */
function config(httpClientProvider){
	httpClientProvider.baseUri = "http://localhost:3000";
}