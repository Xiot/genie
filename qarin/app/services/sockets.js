angular.module('qarin')
    .factory('socketBuilder', function (socketFactory, env, storeService, deviceManager) {

        var builder = function (namespace) {

            var uri = env.apiRoot;
            if(namespace)
                uri += namespace;

            var deviceId = deviceManager.get();

            var myIoSocket = io.connect(uri, {
                query: 'device=' + deviceId
            });

            var socket = socketFactory({
                ioSocket: myIoSocket
            });

            socket.io = myIoSocket;

            function register() {
                
                //var user = securityService.currentUser();
                socket.emit('register', {
                    storeId: storeService.current && storeService.current.id,
                    //userId: user && user._id,
                    deviceId: deviceId,
                    app: 'qarin'
                });
            }

            socket.on('connect', register);
            
            storeService.on('storeChanged', register);
            
            return socket;
        };

        return builder;

    })
    .factory('socket', function(socketBuilder) {
        return socketBuilder();
    });
    