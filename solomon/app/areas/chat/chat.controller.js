angular.module('app.chat')
	.controller('ChatListController', ChatListController);

/* @ngInject */
function ChatListController(storeService, httpClient, eventService, chatService, $rootScope) {

	var vm = angular.extend(this, {
		chats: null,
		sendMessage: sendMessage,
		join: join,
		leave: leave
	});

	eventService.on('storeChanged', onStoreChanged);

	$rootScope.$on('chat-message', function(e, msg){

		var chat = getChat(msg.chat);
		chat.messages.push({
			message: msg.message,
			time: msg.date,
			user: msg.from
		});
	});

	function onStoreChanged(e, store) {
		refreshChats(store);
	}

	function refreshChats(store) {
		if (!store)
			return vm.tasks = [];

		return httpClient.get('/stores/' + store.id + '/chat')
			.then(function(res) {
				return vm.chats = res.data;
			});
	}

	function join(chat){
		chatService.join(chat._id);
	}

	function leave(chat){
		chatService.leave(chat._id);
	}

	function sendMessage(chat, message) {
		return chatService.sendMessage(chat._id, message)
			.then(function() {
				// chat.messages.push({
				// 	message: message,
				// 	sent: true
				// });
			}).catch(function(ex) {
				console.log(ex);
			}).finally(function(){
				chat.currentMessage = '';
			});
	}

	function getChat(id){
		for(var i = 0; i < vm.chats.length; i++){
			if(vm.chats[i]._id == id)
				return vm.chats[i];
		}
		return null;
	}
}