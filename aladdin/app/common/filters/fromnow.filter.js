angular.module('aladdin')
.filter('fromNow', fromNowFilter);

function fromNowFilter(){
	return function(date){
		return moment(date).fromNow();
	};
}