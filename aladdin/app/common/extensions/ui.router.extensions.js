angular.module('aladdin')
.run(addExtensions);


function addExtensions($rootScope, $state){
	
	// add a `on` method to the state that will call the handler when the stateChanges.

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

}