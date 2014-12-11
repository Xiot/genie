
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

angular.module('qarin')
.constant('env', {
    apiRoot: 'http://localhost:3000'
});
angular.module('qarin')
    .factory('socketBuilder', function (socketFactory, env) {

        var builder = function (namespace) {
            var myIoSocket = io.connect(env.apiRoot + namespace);

            mySocket = socketFactory({
                ioSocket: myIoSocket
            });

            return mySocket;
        }

        return builder;

    })
    .factory('chatSocket', function (socketBuilder) {
        return socketBuilder('/chat');        
    })
.factory('notificationSocket', function (socketBuilder) {
    return socketBuilder('/notifications');   
});

angular.module('qarin')
.controller('ChatController', function (chatSocket) {

    var me = this;

    chatSocket.on('init', function (data) {
        me.name = data.name;
    })

    chatSocket.on('chat', function (msg) {
        me.messages.push(msg);
    })
    this.messages = [];

    this.name = "";
    this.message = "";
    this.send = function () {
        chatSocket.emit('chat', this.message);
    }

});
angular.module('qarin')
.controller('HomeController', function ($scope, $http, env, notificationSocket) {

    $scope.requestHelp = function () {
        //notificationSocket
        notificationSocket.emit('help-requested', {});
    };

    $http.get(env.apiRoot)
    .then(function (x) {
        $scope.data = x.data;
    });

});
angular.module('qarin')
.controller('NotificationsController', function ($scope, notificationSocket) {

    $scope.current = {};
    //notificationSocket
    notificationSocket.on('help', function (data) {
        $scope.current = data;
    });
});