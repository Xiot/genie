angular.module('qarin.chat')
	.controller('ChatController', function(socket, storeService, chat, httpClient, $rootScope, chatService, $scope) {

		var vm = angular.extend(this, {
			chat: chat,
			//send: sendMessage,
			message: '',
			product: null,
			associate: chat
		});

		// httpClient.get('/chat/' + chatId)
		// 	.then(function(res) {
		// 		vm.chat = res.data;
		// 	});

		//chatService.chat = chat;
		$scope.$on('$destroy', function(){
			chatService.chat = null;
		});

		$rootScope.$on('chat-message', function(e, msg) {
			if(msg.chat === vm.chat.id)
				vm.chat.messages.push(msg);
		});

		// function sendMessage() {
		// 	var message = vm.message;
		// 	vm.message = '';

		// 	chatService.sendMessage(chat._id, message)
		// 		.then(function(msg) {
		// 			vm.chat.messages.push({
		// 				message: msg.message,
		// 				time: msg.time,
		// 				user: msg.user,
		// 				sent: true
		// 			});
		// 		});
		// }
	});
