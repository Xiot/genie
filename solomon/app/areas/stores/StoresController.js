angular.module('app.stores')
.controller('StoresController', StoresController);

function StoresController(httpClient){
	
	var vm = this;

	vm.stores = [];
	vm.selected = null;
	vm.tasks = [];

	vm.select = function(store){
		vm.selected = store;

		httpClient.get('/stores/' + store.id + '/tasks')
		.then(function(x){
			vm.tasks = x.data;
		});
	};

	init();


	function init(){
		httpClient.get('/stores')
		.then(function(x){
			vm.stores = x.data;
		});
	}
}