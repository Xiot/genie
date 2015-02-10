angular.module('app.chat')
.run(configureRoutes);

/* @ngInject */
function configureRoutes(sectionManager){
	sectionManager.register(getStates());
}

function getStates(){
	return [];
	// return [{
	// 	name: 'chat-list',
	// 	url: '/chats',
	// 	controller: 'ChatListController',
	// 	controllerAs: 'vm',
	// 	templateUrl: 'app/areas/chat/chat-list.html',
	// 	settings: {
	// 		module: true,
	// 		order: 4,
	// 		icon: ['glyphicon', 'glyphicon-cloud']
	// 	}
	// }];
}