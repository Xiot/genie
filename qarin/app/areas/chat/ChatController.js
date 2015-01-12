angular.module('qarin')
	.controller('ChatController', function(socket, storeService, chatId, httpClient, $rootScope, chatService) {

		var vm = angular.extend(this, {
			chat: null,
			send: sendMessage,
			message: ''
		});

		httpClient.get('/chat/' + chatId)
			.then(function(res) {
				vm.chat = res.data;
			});

		$rootScope.$on('chat-message', function(e, msg) {
			vm.chat.messages.push(msg);
		});

		function sendMessage() {
            var message = vm.message;
            vm.message = '';

            chatService.sendMessage(chatId, message)
            .then(function(msg){
                vm.chat.messages.push({message: message});
            });

			// httpClient.post('/chat/' + chatId + '/messages', {
			// 		message: vm.message
			// 	})
			// 	.then(function(res) {
			// 		console.log(res);
			// 		vm.message = '';
			// 	});
		}



		// var me = this;

		// socket.on('init', function (data) {
		//     me.name = data.name;
		// })

		// chatSocket.on('chat', function (msg) {
		//     me.messages.push(msg);
		// })
		// this.messages = [];

		// this.name = "";
		// this.message = "";
		// this.send = function () {
		//     chatSocket.emit('chat', this.message);
		// }

	});