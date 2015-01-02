angular.module('app.layout')
	.config(initializeStates)
	.run(ensureAuthenticated);

/* @ngInject */
function ensureAuthenticated($rootScope, $state, securityService, $timeout) {
	$rootScope.showSplash = true;

	$rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {

		if (toState.name === 'login') {
			//$rootScope.showSplash = false;
			return;
		}

		var user = securityService.currentUser();
		if (user) {
			//$rootScope.showSplash = false;
			return;
		}
		e.preventDefault();

		securityService.requestCurrentUser()
			.then(function(u) {

                var targetState = u ? toState : 'login';

				$state.go(targetState);
			}).catch(function(ex) {
				$state.go('login');
			})

		//console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
	});

    var waitingForView = false;
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        //console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
        //console.log('state.success: ' + toState.name);
        waitingForView = true;
        
    });
	$rootScope.$on('$viewContentLoaded', function(e) {
		
        if(waitingForView){
            waitingForView = false;

console.log('give time to render');
            $timeout(function(){
                console.log('showSplash = false');
                $rootScope.showSplash = false;                    
            }, 1000);
            
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