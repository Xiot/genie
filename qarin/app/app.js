
angular.module('qarin', [    
    'symbiote.common',
    'qarin.partials',
    'ui.router',
    'btford.socket-io'
    ])


.config(function ($stateProvider, $httpProvider) {
    
$httpProvider.interceptors.push('deviceInterceptor');

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
        .state('chat-list', {
            url: '/chat',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chatlist.html',
            controller: 'ChatListController',
            controllerAs: 'vm'
        })
        .state('chat', {
            url: '/chat/:id',
            parent: 'layout',
            templateUrl: 'app/areas/chat/chat.html',
            controller: 'ChatController',
            controllerAs: 'vm',
            resolve: {
                chatId: function($stateParams){
                    return $stateParams.id;
                }
            }
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

angular.module('qarin')
.factory('deviceInterceptor', function($q, storageService){
    return {
        request: function(config){

            if(!config || !config.headers)
                return config;

            config.headers['x-device'] = storageService.get('device');
            return config;
        }
    }
});
