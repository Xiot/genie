angular.module('qarin.chat')
	.controller('ChatListController', ChatListController);

// @ngInject
function ChatListController(httpClient, storeService, $state, chatService) {

	var vm = angular.extend(this, {
		chats: null,
		create: _createNewChat
	});

	_init();

	function _init() {
		var opts = {
			params: {
				store: storeService.current.id
			}
		};

		chatService.getMyChats()
		.then(function(chats){
			var activeChats = [];
			chats.forEach(function(c){
				if(c.lastMessage)
					activeChats.push(c);
			});
			vm.chats = activeChats;
		});

		// httpClient.get('/users/me/chats', opts)
		// 	.then(function(res) {
		// 		vm.chats = parse(res.data);
		// 	});
	}

	function _createNewChat(){

		chatService.create()
		.then(function(chat){
			$state.go('chat', {chatId: chat._id});
		});

		// httpClient.post('/stores/' + storeService.current.id + '/chat')
		// .then(function(res){
		// 	$state.go('chat', {id: res.data._id});
		// });
	}
}
