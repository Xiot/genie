﻿angular.module('qarin.chat')
	.controller('ChatController', function(socket, storeService, chat, httpClient, $rootScope, chatService) {

		var vm = angular.extend(this, {
			chat: chat,
			send: sendMessage,
			message: '',
			product: null
		});

		// httpClient.get('/chat/' + chatId)
		// 	.then(function(res) {
		// 		vm.chat = res.data;
		// 	});

		$rootScope.$on('chat-message', function(e, msg) {
			vm.chat.messages.push(msg);
		});

		function sendMessage() {
			var message = vm.message;
			vm.message = '';

			chatService.sendMessage(chat._id, message)
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