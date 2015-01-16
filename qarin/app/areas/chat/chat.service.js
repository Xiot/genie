angular.module('qarin')
	.factory('chatService', ChatFactory);

/* @ngInject */
function ChatFactory($rootScope, httpClient, socket, storeService) {

	var service = {
		sendMessage: sendMessage,
		create: _createChat
	};

	init();

	return service;

	function sendMessage(id, message) {

		var url = '/chat/' + id + '/messages';
		return httpClient.post(url, {message: message})
			.then(function(res){
				return res.data;
			});
	}

	function _createChat(opts){

		return httpClient.post('/stores/' + storeService.current.id + '/chat', opts)
		.then(function(res){
			return res.data;
		});
	}

	function init(){
		socket.on('message', function(data){
			console.log(data);
			$rootScope.$emit('chat-message', data);
		});
	}
}