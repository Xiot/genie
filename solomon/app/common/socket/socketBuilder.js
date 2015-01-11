angular.module('app.socket')
    .factory('socketBuilder', function (socketFactory, env) {

        var builder = function (namespace) {

            namespace = namespace || '';

            var myIoSocket = io.connect(env.apiRoot + namespace);

            var mySocket = socketFactory({
                ioSocket: myIoSocket
            });

            return mySocket;
        }

        return builder;

    })

    .factory('socket', function(socketBuilder){
        return socketBuilder();
    });
