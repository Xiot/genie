angular.module('aladdin.layout')
.controller('LoginController', LoginController);

/* @ngInject */
function LoginController(securityService, $state, storeService){
	
	var vm =this;
	vm.login = {
		username: "",
		password: "",
		rememberMe: false
	};

	this.busy = false;
	this.message = "";

	this.login = function(){
		this.busy = true;
		this.message = "";

		securityService.login(vm.login.username, vm.login.password, vm.login.rememberMe)
			.then(function(user){
                return storeService.setStoreById(user.store);
            
			}).then(function(store){
				$state.go('dashboard');
			})
			.catch(function(ex){
				vm.message = (ex.data && ex.data.message) || JSON.stringify(ex) || "Unable to log in";

			}).finally(function(){
				vm.busy = false;
			});

	};

}