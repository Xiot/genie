angular.module('app.chat')
	.controller('ChatListController', ChatListController);

/* @ngInject */
function ChatListController(storeService, httpClient, eventService, chatService, $rootScope, securityService) {

	var vm = angular.extend(this, {
		chats: null,
		sendMessage: sendMessage,
		currentChat: null,
		selectChat: _selectChat,
		isSelected: _isChatSelected
	});

	if(storeService.currentStore)
		onStoreChanged(null, storeService.currentStore);

	eventService.on('storeChanged', onStoreChanged);

	$rootScope.$on('chat-message', function(e, msg) {

		if(securityService.currentUser()._id == msg.user)
			return;

		var chat = getChat(msg.chat);

		if (vm.currentChat && vm.currentChat._id == msg.chat) {
			vm.currentChat.messages.push({
				message: msg.message,
				time: msg.time,
				user: msg.user
			});
		} else {
			chat.hasUnread = true;
		}
	});

	$rootScope.$on('new-chat', function(e, msg){
		vm.chats.unshift(msg);
	});

	function onStoreChanged(e, store) {
		refreshChats(store);
	}

	function refreshChats(store) {
		return chatService.getAllForStore(store.id)
			.then(function(chatlist) {
				vm.chats = chatlist;
			});
	}

	function sendMessage(chat, message) {
		return chatService.sendMessage(chat._id, message)
			.then(function(msg) {
				chat.messages.push({
					message: msg.message,
					time: msg.time,
					user: msg.user,
					sent: true
				});
			}).catch(function(ex) {
				console.log(ex);
			}).finally(function() {
				chat.currentMessage = '';
			});
	}

	function _selectChat(id) {
		chatService.getById(id)
			.then(function(chat) {
				vm.currentChat = chat;
				//vm.hasUnread = false;

				getChat(chat._id).hasUnread = false;

			});
	}

	function _isChatSelected(chat){

		if(!vm.currentChat)
			return false;

		return chat._id == vm.currentChat._id;
	}

	function getChat(id) {
		for (var i = 0; i < vm.chats.length; i++) {
			if (vm.chats[i]._id == id)
				return vm.chats[i];
		}
		return null;
	}
}