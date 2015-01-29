angular.module('qarin')
.directive('qaSetStoreClass', setStoreClass);

// @ngInject
function setStoreClass(storeService){

	return {
		link: _linkFn
	};

	function _linkFn(scope, element, attrs){

		storeService.on('storeChanged', function(e, args){
			//attrs.id = args.store.organization.alias;
			element.attr("id", args.store.organization.alias);
		});
	}
}