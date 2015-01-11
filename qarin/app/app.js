
angular.module('qarin', [
    'genie.common',
    'symbiote.common',
    'qarin.partials',
    'ui.router',
    'btford.socket-io'
    ])


.config(function ($stateProvider) {
    $stateProvider
        .state('root', {
            url: '',
            abstract: true,
            views: {
                '': {
                    //controller: 'RootController',
                    templateUrl: 'app/areas/layout/layout.html'
                },
                notifications: {
                    controller: 'NotificationsController',
                    templateUrl: 'app/areas/notifications/notifications.html'
                }
            }
        })
        .state('layout', {
            url: '',
            parent: 'root',
            abstract: true,
            template: '<ui-view></ui-view>'
        })
        .state('home', {
            url: '',
            parent: 'layout',
            templateUrl: 'app/areas/home/home.html',
            controller: 'HomeController'
        })
        .state('chat', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chat.html',
            controller: 'ChatController',
            controllerAs: 'vm'
        });
});

angular.module('qarin')
.run(function ($rootScope) {

    $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
        console.log(unfoundState.to); // "lazy.state"
        console.log(unfoundState.toParams); // {a:1, b:2}
        console.log(unfoundState.options); // {inherit:false} + default options
    })
});
