angular.module('app.layout')
    .config(initializeStates);

/* @ngInject */
function initializeStates($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');


    $stateProvider
        .state('root', {
            url: '/',
            //abstract: true,
            template: '<div ui-view></div>',
            resolve: {
                // @ngInject
                user: function(securityService){
                    return securityService.requestCurrentUser();
                }
            }, 
            onEnter:/* @ngInject */ function($state, user){
                if(user)
                    return $state.go('dashboard');

                $state.go('login');
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
            //parent: 'root',
            abstract: true,
            controller: 'ShellController',
            templateUrl: 'app/layout/shell.html',
            resolve: {
                //user: function()
            },
            onEnter: function(){
                console.log('ShellController.onEnter');
            }
        });
}