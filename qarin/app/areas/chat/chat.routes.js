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
			templateUrl: 'app/areas/chat/chat.html',
			controller: 'ChatController',
			controllerAs: 'vm',
			resolve: {
				chatId: function($stateParams) {
					return $stateParams.chatId;
				},
				chat: function(chatId, chatService) {
					return chatService.getById(chatId);
				}
			}
		})
}