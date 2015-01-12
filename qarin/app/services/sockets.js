angular.module('qarin')
    .factory('socketBuilder', function (socketFactory, env, storageService) {

        var builder = function (namespace) {

            var uri = env.apiRoot;
            if(namespace)
                uri += namespace;

            var deviceId = storageService.get('device');

            var myIoSocket = io.connect(uri, {
                query: 'device=' + deviceId
            });

            var mySocket = socketFactory({
                ioSocket: myIoSocket
            });

            return mySocket;
        }

        return builder;

    })
    .factory('socket', function(socketBuilder) {
        return socketBuilder();
    });
    