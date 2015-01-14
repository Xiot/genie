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
				.then(function(msg) {
					vm.chat.messages.push({
						message: msg.message,
						time: msg.time,
						user: msg.user,
						sent: true
					});
				});
		}
	});