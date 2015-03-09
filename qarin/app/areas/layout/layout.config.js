angular.module('qarin')
.run(ensureAuthenticated);

/* @ngInject */
function ensureAuthenticated($rootScope, $state, $timeout, storeService, errorService) {
	$rootScope.showSplash = true;

	$rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {

		// if (toState.name === 'login') {
		// 	return;
		// }

		var store = storeService.current;
		if(store)
			return;

		e.preventDefault();


		storeService.getCurrentStore()
		.then(function(ret){
			$state.go(toState, toParams);

		}).catch(function(err){
			errorService.lastError = err;
			$state.go('error');
		});

		// securityService.requestCurrentUser()
		// 	.then(function(u) {

		// 		var targetState = u ? toState : 'login';

		// 		$state.go(targetState);
		// 	}).catch(function(ex) {
		// 		$state.go('login');
		// 	});
	});

	var waitingForView = false;
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

		if(!$rootScope.showSplash)
			return;

		waitingForView = true;
	});

	$rootScope.$on('$viewContentLoaded', function(e) {


		if (waitingForView && $rootScope.showSplash) {
			waitingForView = false;

			console.log('give time to render');
			$timeout(function() {
				console.log('showSplash = false');
				$rootScope.showSplash = false;
			}, 10);

		}

	});
}
