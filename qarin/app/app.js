
angular.module('qarin', ['ui.router', 'btford.socket-io'])


.config(function ($stateProvider) {
    $stateProvider
        .state('root', {
            url: '',
            abstract: true,
            views: {
                '': {
                    //controller: 'RootController',
                    templateUrl: 'partials/layout.html'
                },
                notifications: {
                    controller: 'NotificationsController',
                    templateUrl: 'partials/notifications.html'
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
            templateUrl: 'partials/home.html',
            controller: 'HomeController'
        })
        .state('chat', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'partials/chat.html',
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
