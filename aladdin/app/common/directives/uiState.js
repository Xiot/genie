angular.module('aladdin')
	.directive('uiState', uiState);

/* @ngInject */
function uiState($state) {

	return {
		restrict: 'A',
		link: link,
		require: '?uiSrefActive'
	};
 
	function link(scope, element, attrs, uiSrefActive) {

		var name = scope.$eval(attrs.uiState);
		var params = scope.$eval(attrs.uiStateParams);

		var url = $state.href(name, params);

		if(url === "")
			url = "/";

		attrs.$set('href', url);

		var s = $state.get(name);

		if(!uiSrefActive)
			return;
		uiSrefActive.$$setStateInfo(s, {});
	}
}