angular.module('qarin')
	.controller('ChatListController', ChatListController);

// @ngInject
function ChatListController(httpClient, storeService, $state) {

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

		httpClient.get('/users/me/chats', opts)
			.then(function(res) {
				vm.chats = parse(res.data);
			});
	}

	function _createNewChat(){
		httpClient.post('/stores/' + storeService.current.id + '/chat')
		.then(function(res){
			$state.go('chat', {id: res.data._id});
		});
	}
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