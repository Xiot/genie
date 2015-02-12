angular.module('app.employees')
	.controller('EmployeesController', EmployeesController);

/* @ngInject */
function EmployeesController(storeService, eventService, httpClient, socket, $scope) {

	var vm = angular.extend(this, {
		employees: [],
		groupedEmployees: []
	});

	eventService.on('storeChanged', onStoreChanged);

	var unlisten = socket.on('employee:status', function(data) {
		var found = _.find(vm.employees, function(emp){
			return emp._id === data.employee._id;
		});

		if(found){
			angular.extend(found, data.employee);
			vm.groupedEmployees = groupByStatus(vm.employees);
		}
	});

	$scope.$on('$destroy', function(){
		unlisten();
	});

	refreshEmployees(storeService.currentStore);

	function onStoreChanged(e, store) {
		refreshEmployees(store);
	}

	function groupByStatus(employees) {
		var grouped = _.groupBy(employees, 'status');
		var asArray = [];

		_.forEach(grouped, function(item, key) {
			asArray.push({
				status: key,
				employees: item
			});
		});

		var statusOrder = ['available', 'break', 'busy', 'offline'];
		var sorted = _.sortBy(asArray, function(item) {
			var index = _.indexOf(statusOrder, item.status);
			if (index == -1)
				index = 100;
			return index;
		});
		return sorted;
	}

	function refreshEmployees(store) {
		if (!store) {
			vm.employees = [];
			return;
		}

		httpClient.get('/stores/' + store.id + '/employees', {
				cache: false
			})
			.then(function(res) {
				vm.employees = res.data;
				vm.groupedEmployees = groupByStatus(res.data);

			});

	}
}