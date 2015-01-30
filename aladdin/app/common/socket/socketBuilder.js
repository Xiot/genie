angular.module('aladdin.socket')
	.factory('socketBuilder', function(socketFactory, env, storageService, securityService, storeService) {

		var builder = function(namespace) {

			namespace = namespace || '';

			var device = storageService.get('device-id');

			// if this is undefined then generate a new device key
			// should be seperated into a different service.

			var myIoSocket = io.connect(env.apiRoot + namespace, {
				query: 'device=' + device
			});

			var socket = socketFactory({
				ioSocket: myIoSocket
			});

            socket.io = myIoSocket;

			function register() {
				
				var user = securityService.currentUser();
				socket.emit('register', {
					storeId: storeService.currentStore && storeService.currentStore.id,
					userId: user && user._id,
                    deviceId: device,
                    app: 'aladdin'
				});
			}

            socket.on('connect', register);
            
            storeService.on('storeChanged', register);
            securityService.on('userChanged', register);

			return socket;
		};

		return builder;

	})
	.factory('socket', function(socketBuilder) {
		var socket = socketBuilder();
		return socket;

	});