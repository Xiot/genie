﻿
angular.module('solomon', [
    'app.config',
    'app.layout',
    'app.logging',
    'app.sections',
    'app.security',
    'app.data',
    'app.socket',
    'solomon.partials',
    'app.dashboard',
    'app.stores',
    'app.tasks',
    'app.chat',
    'app.employees',
    'symbiote.common',
    'ngAnimate',

    //'googlechart',
    //'angularCharts',
    'angular-flot',
    'app.charts'

]);

angular.module('solomon')
    .config(config);

/* @ngInject */
function config(httpClientProvider, $httpProvider, env) {
    httpClientProvider.baseUri = env.apiRoot; //"http://localhost:3000";

    $httpProvider.defaults.useXDomain = true;
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.cache = true;

}

angular.module('solomon')
    .run(function($state, $rootScope) {
        $rootScope.$state = $state;
    });

// TODO:  http://stackoverflow.com/questions/21841426/add-http-header-in-javascript-to-requests-for-images
