angular.module('app.chat')
	.factory('chatService', ChatFactory);

/* @ngInject */
function ChatFactory($rootScope, httpClient, socket, $q, storeService) {

	var service = {
		sendMessage: sendMessage,
		getById: _getById,
		getAllForStore: _getAllForStore
	}

	init();

	return service;

	function _getById(id) {
		return httpClient.get('/chat/' + id)
			.then(function(res) {
				return res.data;
			});
	}

	function _getAllForStore(storeId) {

		if (!storeId)
			return $q.reject('no store id');

		return httpClient.get('/stores/' + storeId + '/chat')
			.then(function(res) {
				return res.data;
			});
	}

	function sendMessage(id, message) {

		var url = '/chat/' + id + '/messages';
		return httpClient.post(url, {
				message: message
			})
			.then(function(res) {
				return res.data;
			});
	}

	function init() {

		// socket.on('connect', function(a, b) {
			
		// 	var id = storeService.currentStore && storeService.currentStore.id;
		// 	if(id)
		// 		_register(id);
		// });

		// storeService.on('storeChanged', function(e, store) {
		// 	_register(store.id);
		// });

		socket.on('message', function(data) {
			console.log(data);
			$rootScope.$emit('chat-message', data);
		});

		socket.on('new-chat', function(data) {
			console.log('new-chat', data);
			$rootScope.$emit('new-chat', data);
		});
	}

	// function _register(storeId) {
	// 	console.log('register: ' + storeId);
	// 	socket.emit('register', {
	// 		app: 'solomon',
	// 		storeId: storeId
	// 	});
	// }
}