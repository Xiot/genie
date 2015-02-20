angular.module('qarin.products')
.controller('SearchController', SearchController);

// @ngInject
function SearchController(httpClient, storeService, query, $state, $location){

	var vm = angular.extend(this, {
		products: [],
		query: query || '',
		search: _search,
		departments: null
	});

	_init();

	function _init(){
		
		storeService.getDepartments(storeService.current.id)
		.then(function(depts){
			vm.departments = depts;
		}).catch(function(ex){
			console.log(ex);
		});

		if(!vm.query)
		 	return;
		
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