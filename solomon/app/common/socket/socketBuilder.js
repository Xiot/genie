angular.module('app.socket')
    .factory('socketBuilder', function (socketFactory, env, storageService) {

        var builder = function (namespace) {

            namespace = namespace || '';

            var device = storageService.get('device-id');

            // if this is undefined then generate a new device key
            // should be seperated into a different service.

            var myIoSocket = io.connect(env.apiRoot + namespace, {
                query: 'device=' + device
            });

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
