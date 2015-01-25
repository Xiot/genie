angular.module('app.tasks')
	.controller('TaskListController', TaskListController);

/* @ngInject */
function TaskListController(storeService, httpClient, eventService) {

	var vm = angular.extend(this, {
		tasks: null
	});

	eventService.on('storeChanged', onStoreChanged);

	refreshTasks(storeService.currentStore);

	function onStoreChanged(e, store) {
		refreshTasks(store);
	}

	function refreshTasks(store) {

		if (!store) {
			vm.tasks = [];
			return;
		}

		httpClient.get('/stores/' + store.id + '/tasks')
			.then(function(res) {
				vm.tasks = res.data;
			});
	}
}