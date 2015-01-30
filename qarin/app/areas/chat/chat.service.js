angular.module('qarin.chat')
	.factory('chatService', ChatFactory);

/* @ngInject */
function ChatFactory($rootScope, httpClient, socket, storeService) {

	var service = {
		sendMessage: sendMessage,
		create: _createChat,
		getById: getChatById,
		getMyChats: getMyChats
	};

	init();

	return service;

	function sendMessage(id, message) {

		var url = '/chat/' + id + '/messages';
		return httpClient.post(url, {
				message: message
			})
			.then(function(res) {
				return res.data;
			});
	}

	function _createChat(opts) {

		return httpClient.post('/stores/' + storeService.current.id + '/chat', opts)
			.then(function(res) {
				return res.data;
			});
	}

	function getChatById(id) {
		return httpClient.get('/chat/' + id)
			.then(function(res) {
				return new Chat(res.data);
			});
	}

	function init() {
		socket.on('chat:message', function(data) {
			console.log(data);
			$rootScope.$emit('chat-message', data);
		});
	}

	function getMyChats() {
		return httpClient.get('/users/me/chats')
			.then(function(res) {
				return parse(res.data);
			});
	}

	function parse(data) {

		return data.map(function(x) {
			return new Chat(x);
		});
	}

	function Chat(data) {

		// copy raw properties
		angular.extend(this, data);

		var myDeviceId = 'dev-1';
		var others = [];

		data.participants.forEach(function(x) {
			if (x.device === myDeviceId)
				return;

			others.push(x.firstName);
		});

		this.users = others.join(', ');

		this.lastMessage = data.messages.slice(-1)[0];

	}
}