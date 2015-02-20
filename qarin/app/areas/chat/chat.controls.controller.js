
angular.module('qarin.chat')
	.controller('ChatControlsController', ChatControlsController);

function ChatControlsController(chatService, chat) {

	var vm = angular.extend(this, {
		chat: chat,
		message: '',
		send: sendMessage
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
}
