angular.module('app.chat')
	.factory('chatService', ChatFactory);

/* @ngInject */
function ChatFactory($rootScope, httpClient, socket) {

	var service = {
		sendMessage: sendMessage,
		join: join,
		leave: leave
	}

	init();

	return service;

	function sendMessage(id, message) {

		var url = '/chat/' + id + '/messages';
		return httpClient.post(url, {message: message})
			.then(function(res){
				return res.data;
			});
	}

	function join(id){
		socket.emit('join', {id: id});
	}

	function leave(id){
		socket.emit('leave', {id: id});
	}

	function init(){
		socket.on('message', function(data){
			console.log(data);
			$rootScope.$emit('chat-message', data);
		});
	}
}