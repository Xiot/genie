angular.module('aladdin.tasks')
.controller('TaskListController', TaskListController);

// @ngInject
function TaskListController(storeService){

	var vm = angular.extend(this, {
		tasks: null
	});

	init();

	function init(){
		storeService.getTasks()
		.then(function(tasks){
			vm.tasks = tasks;
		});
	}

}