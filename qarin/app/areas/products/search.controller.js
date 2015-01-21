angular.module('qarin.products')
.controller('SearchController', SearchController);

// @ngInject
function SearchController(httpClient, storeService, query, $state, $location){

	var vm = angular.extend(this, {
		products: [],
		query: query || '',
		search: _search
	});

	_init();

	function _init(){
		 if(!vm.query)
		 	return;
		// 	_search();

		var url = '/stores/' + storeService.current.id + '/products?search=' + vm.query;
		httpClient.get(url)
		.then(function(res){
			vm.products = res.data;
		});
	}

	function _search(){

		// var originalUrl = $location.url();
		// var url = $state.href('search', {query: vm.query});
		// if(originalUrl !== url)
		// 	$location.url(url);
		//$location.push
		$state.go('search', {query: vm.query}, {reload: true});
		
	}
}