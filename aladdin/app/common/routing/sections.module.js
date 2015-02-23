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

    // add a `on` method to the state that will call the handler when the stateChanges.
    //  This currently leaks, as the handlers array will have a handle to the controller 
    //  through the callback.    
    var handlers = [];
    $state.on = function(handler) {
        handlers.push(handler);
        return function() {

            var index = handlers.indexOf(handler);
            if (index >= 0)
                handlers.splice(index, 1);

        };
    }
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

        for (var i = 0; i < handlers.length; i++) {
            handlers[i](toParams);
        }
    });
    // ------------------------

    // Override the $destroy method on the scope to call the `dispose` method 
    //  on the $scope or on the $scope.vm object
    var ctor = $rootScope.constructor;
    (function(destroy) {
        ctor.prototype.$destroy = function() {
            
            // call the original destroy
            destroy.apply(this, arguments);

            if(this.hasOwnProperty('dispose')){
                // call the dispose method and pass in the scope
                this.dispose.call(this, this);

            } else if(this.hasOwnProperty('vm') && this.vm.hasOwnProperty('dispose')){
                // call the dispose method and pass in the scope
                this.vm.dispose.call(this, this);
            }
        }
    })(ctor.prototype.$destroy)



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