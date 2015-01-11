angular.module('qarin')
.factory('notificationService', NotificationService);

/* @ngInject */
function NotificationService($rootScope, socketBuilder){

	var socket = socketBuilder('');

	socket.on('message', function(data){
		$rootScope
	})

}