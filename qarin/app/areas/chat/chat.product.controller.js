
angular.module('qarin.chat')
.controller('ChatProductController', ChatProductController);

function ChatProductController(chat){
	var vm = angular.extend(this, {
		chat: chat
	});
}