angular.module('qarin')
	.factory('chatService', ChatFactory);

/* @ngInject */
function ChatFactory($rootScope, httpClient, socket) {

	var service = {
		sendMessage: sendMessage,
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

	function init(){
		socket.on('message', function(data){
			console.log(data);
			$rootScope.$emit('chat-message', data);
		});
	}
}