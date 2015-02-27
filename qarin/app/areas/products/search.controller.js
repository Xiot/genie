angular.module('qarin.products')
.controller('SearchController', SearchController);

// @ngInject
function SearchController(httpClient, storeService, query, $state, $location, department, ticketService){

	var vm = angular.extend(this, {
		products: [],
		query: query || '',
		search: _search,
		departments: null,
		department: department,
		noResults: false,
		requestHelp: _requestHelp,
		removeDepartment: _removeDepartment
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

		if(vm.department)
			url += '&department=' + (vm.department._id || vm.department.id);

		httpClient.get(url)
		.then(function(res){
			vm.products = res.data;
			vm.noResults = res.data.length == 0;
		});		
	}

 	function _requestHelp() { 
        //return storeService.requestHelp();

        return ticketService.create({searchText: vm.query})
        .then(function(ticket){
            return $state.go('ticket-created', {ticketId: ticket.id});
        });
    }

    function _removeDepartment(){
    	var params = {
			query: vm.query,
			department: null
		};

		$state.go('search', params, {reload: true});
    }

	function _search(){

		// var originalUrl = $location.url();
		// var url = $state.href('search', {query: vm.query});
		// if(originalUrl !== url)
		// 	$location.url(url);
		//$location.push

		var params = {
			query: vm.query
		};
		if(vm.department)
			params.department = vm.department._id || vm.department.id;

		$state.go('search', params, {reload: true});
		
	}
}