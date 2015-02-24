angular.module('aladdin')
.run(addExtensions);


function addExtensions($rootScope){
	 
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

            } else if(this.hasOwnProperty('vm') && this.vm.hasOwnProperty('$dispose')){
                // call the dispose method and pass in the scope
                this.vm.$dispose.call(this, this);
            }
        }
    })(ctor.prototype.$destroy);

}