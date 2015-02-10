angular.module('app.tasks')
	.controller('TaskListController', TaskListController);

/* @ngInject */
function TaskListController(storeService, httpClient, eventService, ticketService) {

	var vm = angular.extend(this, {
		tasks: [],
		stats: []
	});

	eventService.on('storeChanged', onStoreChanged);

	refreshTasks(storeService.currentStore);
	refreshStats(storeService.currentStore);

	function onStoreChanged(e, store) {
		refreshTasks(store);
		refreshStats(store);
	}

	function refreshStats(store) {
		return ticketService.getStats()
			.then(function(stats) {
				vm.stats = stats;
			})
			// if(!store)
			// 	return vm.stats = [];

		// httpClient.get('/stores/' + store.id + '/tasks/stats')
		// .then(function(res){

		// 	var order = ['unassigned', 'assigned', 'engaged', 'complete'];

		// 	var stats = _.sortBy(res.data, function(item){
		// 		var index = order.indexOf(item.status);
		// 		if(index === -1)
		// 			index = 100;
		// 		return index;
		// 	});

		// 	vm.stats = stats;
		// });
	}

	function refreshTasks(store) {

		return ticketService.getAllOpen()
			.then(function(tasks) {
				vm.tasks = tasks;
			});
		// if (!store) {
		// 	vm.tasks = [];
		// 	return;
		// }

		// httpClient.get('/stores/' + store.id + '/tasks/open')
		// 	.then(function(res) {
		// 		vm.tasks = res.data.map(function(t){
		// 			return new Task(t);
		// 		});
		// 	});
	}
}