angular.module('aladdin.layout')
	.config(initializeStates)
	.run(ensureAuthenticated);

/* @ngInject */
function ensureAuthenticated($rootScope, $state, securityService, $timeout, storeService) {
	$rootScope.showSplash = true;

	$rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {

		console.log('stateChangeStart: ' + toState.name, toParams);

		if (toState.name === 'login') {
			return;
		}

		var user = securityService.currentUser();
		if (user) {
			return;
		}
		e.preventDefault();

		securityService.requestCurrentUser()
			.then(function(u) {
				if(!u)
					return $state.go('login');
				
				// Ensure that the store is available
				return storeService.setStoreById(u.store)
					.then(function() {
						var targetState = u ? toState : 'login';
						$state.go(targetState, toParams);
					});

			}).catch(function(ex) {
				$state.go('login');
			});
	});

	var waitingForView = false;
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

		console.log('stateChangeSuccess: ' + toState.name, toParams);
		if (!$rootScope.showSplash)
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

/* @ngInject */
function initializeStates($stateProvider, $urlRouterProvider) {

	$urlRouterProvider.otherwise('/');


	$stateProvider
		.state('root', {
			url: '',
			abstract: true,
			template: '<div ui-view></div>',
			controller: function($scope, $rootScope) {

				if ($rootScope.showSplash === undefined)
					$rootScope.showSplash = true;
			},
			resolve: {
				// @ngInject
				user: function(securityService) {
					return securityService.requestCurrentUser();
				}
			},
			onEnter: /* @ngInject */ function($state, user) {
				// if(user)
				//     return $state.go('dashboard');

				// $state.go('login');
			}
		})
		.state('login', {
			// url: '',
			controller: 'LoginController',
			controllerAs: "vm",
			templateUrl: 'app/areas/login/login.html'
		})
		.state('app-root', {
			//url: '',
			parent: 'root',
			abstract: true,
			controller: 'ShellController',
			templateUrl: 'app/layout/shell.html',
			resolve: {
				//user: function()
			},
			onEnter: function() {
				console.log('ShellController.onEnter');
			}
		});
}