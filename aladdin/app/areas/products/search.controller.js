angular.module('aladdin.products')
	.controller('SearchController', SearchController);

function SearchController(productService, $state, $scope) {

	console.log('SearchController.ctor');

	var vm = angular.extend(this, {
		query: $state.params.search,
		search: search,

		products: [],

		dispose: dispose
	});

	if (vm.query)
		executeSearch(vm.query);

	var off = $state.on(function(params) {

		if (vm.query !== params.search) {
			vm.query = params.search;
			executeSearch(vm.query);
		}
	});

	$scope.$on('$destroy', function() {
		off();
	});

	function dispose(){
		console.log('i was disposed', vm === this);
	}

	function search() {

		$state.go('search', {search: vm.query}, {location: true});

		executeSearch(vm.query);
	}

	function executeSearch(text) {
		productService.find(text)
			.then(function(list) {
				vm.products = list;
			});
	}

}