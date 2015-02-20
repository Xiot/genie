angular.module('qarin.chat')
	.config(configureRoutes);

function configureRoutes($stateProvider) {

	$stateProvider
		.state('chat-list', {
			url: '/chat',
			//parent: 'layout',
			templateUrl: 'app/areas/chat/chatlist.html',
			controller: 'ChatListController',
			controllerAs: 'vm'
		})
		.state('chat', {
			url: '/chat/:chatId',
			//parent: 'layout',

			resolve: {
				chatId: function($stateParams) {
					return $stateParams.chatId;
				},
				chat: function(chatId, chatService) {
					return chatService.getById(chatId);
				},
				product: function(chat){

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
					controller: 'ChatControlsController'
				},
				'header@': {
					templateUrl: 'app/areas/chat/chat.product.html',
					controllerAs: 'vm',
					controller: 'ChatProductController'
				}
			}
		});
}
