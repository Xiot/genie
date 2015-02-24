angular.module('aladdin.sections', ['ui.router']);


angular.module('aladdin.sections').run(debugRoutes);

/* @ngInject */
function debugRoutes($rootScope, $state, $stateParams) {
    // Credits: Adam's answer in http://stackoverflow.com/a/20786262/69362
    // Paste this in browser's console

    //var $rootScope = angular.element(document.querySelectorAll("[ui-view]")[0]).injector().get('$rootScope');

    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams) {
        console.log('$stateChangeError - fired when an error occurs during transition.');
        console.log(arguments);
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
        console.log(unfoundState, fromState, fromParams);
    });


    // ------------------------

   



    // $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
    //     console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
    // });

    // $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    //     console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
    // });

    // $rootScope.$on('$viewContentLoaded', function (event) {
    //     console.log('$viewContentLoaded - fired after dom rendered', event);
    // });


}