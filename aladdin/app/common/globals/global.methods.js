angular.module('aladdin.globals', [])
.run(addGlobals);

function addGlobals($rootScope, securityService) {

	$rootScope.isMe = function(user){

		if(!user)
			return false;

		var currentUser = securityService.currentUser();
		if(!currentUser)
			return false;

		var currentUserId = currentUser.id || currentUser._id;

		if(typeof user === 'string')
			return currentUserId === user;

		var id = user.id || user._id;
		return currentUserId === id;

	}
}