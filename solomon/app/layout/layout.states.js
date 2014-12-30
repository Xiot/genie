angular.module('app.layout')
    .config(intializeStates);


function initializeStates($stateProvider) {
    $stateProvider
        .state('root', {
            url: '',
            template: '<div ui-view></div>'
        })
        .state('login', {
            url: '',
            controller: 'LoginController',
            templateUrl: 'app/areas/login/login.html'
        })
        .state('app-root', {
            url: '',
            controller: 'ShellController',
            templateUrl: 'app/layout/shell.html',
            resolve: {
                user: function()
            }
        });
}