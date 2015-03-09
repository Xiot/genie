angular.module('qarin')
.service('util', UtilService);

function UtilService(){

	this.join = function(){
		var args = [].slice.call(arguments);
		return '/' + args.join('/');
	};

}
