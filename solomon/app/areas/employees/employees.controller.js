angular.module('app.employees')
	.controller('EmployeesController', EmployeesController);

/* @ngInject */
function EmployeesController(storeService, eventService, httpClient) {

	var vm = angular.extend(this, {
		employees: []
	});

	eventService.on('storeChanged', onStoreChanged);

	refreshEmployees(storeService.currentStore);

	function onStoreChanged(e, store) {
		refreshEmployees(store);
	}

	function refreshEmployees(store) {
		if (!store) {
			vm.employees = [];
			return;
		}

		httpClient.get('/stores/' + store.id + '/employees', {cache: false})
			.then(function(res) {
				vm.employees = res.data;
			});

	}
}