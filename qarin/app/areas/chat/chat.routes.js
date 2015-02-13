angular.module('qarin.chat')
	.config(configureRoutes);

function configureRoutes($stateProvider) {

	$stateProvider
		.state('chat-list', {
			url: '/chat',
			parent: 'layout',
			templateUrl: 'app/areas/chat/chatlist.html',
			controller: 'ChatListController',
			controllerAs: 'vm'
		})
		.state('chat', {
			url: '/chat/:chatId',
			parent: 'layout',

			resolve: {
				chatId: function($stateParams) {
					return $stateParams.chatId;
				},
				chat: function(chatId, chatService) {
					return chatService.getById(chatId);
				}
			},
			views: {
				'': {
					templateUrl: 'app/areas/chat/chat.html',
					controller: 'ChatController',
					controllerAs: 'vm'
				},
				'footer@': {
					templateUrl: 'app/areas/chat/chat.controls.html',
					controllerAs: 'vm',
					controller: 'BoxServiceController'
				}
			}
		});
}

angular.module('qarin.chat')
	.controller('BoxServiceController', boxService);

function boxService(chatService, chat) {

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