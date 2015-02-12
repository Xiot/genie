angular.module('aladdin.layout')
	.controller('HeaderController', HeaderController);

/* @ngInject */
function HeaderController(securityService, storeService, eventService, util, httpClient, socket, $scope) {

	var vm = angular.extend(this, {
		message: "Hello Header",
		user: securityService.currentUser(),
		store: storeService.currentStore,
		logout: logout,
		status: null,

		setAvailable: setAvailable,
		setStatus: setStatus
	});

	init();

	function init() {
		securityService.requestCurrentUser()
			.then(function(x) {
				vm.user = x;
				vm.status = x.status;
			}); 

		securityService.on('userChanged', handleUserChanged);

		storeService.on('storeChanged', function(e, store){
			vm.store = store;
		});
 
		var unlisten = socket.on('employee:status', function(data){
			vm.status = data.employee.status;
		});

		$scope.$on('$destroy', function(){
			unlisten();
		});
		
	}

	function handleUserChanged(user) {
		vm.user = user;
	}

	function logout(){
		return securityService.logout();
	}

	function setAvailable(){
		return setStatus('available');
	}

	function setStatus(status){
		var url = util.join('stores', vm.store.id, 'employees', vm.user._id, 'status');
		return httpClient.put(url, {status: status});
	}
}