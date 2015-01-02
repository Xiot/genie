angular.module('solomon')
	.directive('uiState', uiState);

/* @ngInject */
function uiState($state) {

	return {
		restrict: 'A',
		link: link,

	};
 
	function link(scope, element, attrs) {

		var name = scope.$eval(attrs.uiState);
		var params = scope.$eval(attrs.uiStateParams);

		var url = $state.href(name, params);

		if(url === "")
			url = "/";

		attrs.$set('href', url);

	}
}