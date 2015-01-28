angular.module('aladdin.tasks')
.controller('TaskListController', TaskListController);

// @ngInject
function TaskListController(taskService, securityService){

	var vm = angular.extend(this, {
		tasks: null,
		selected: null,
		select: selectTask,
		accept: acceptTask,
		complete: completeTask
	});

	init();

	function init(){
		return taskService.getAvailable()
		.then(function(tasks){
			
			var user = securityService.currentUser();

			var newTasks = tasks.map(function(t){
				t.displayTitle = t.title ||t.type;
				t.mine = (user._id === t.assigned_to);

				//t.age = 
				return t;
			});

			vm.tasks = newTasks;

			if(vm.tasks.length > 0)
				vm.select(vm.tasks[0]);

		});
	}

	function selectTask(task){
		vm.tasks.forEach(function(t){
			t.selected = false;
		});
		task.selected = true;
		vm.selected = task;
	}

	function acceptTask(task){
		return taskService.accept(task || vm.selected);
	}
	function completeTask(task){

	}
}

function Task(rawTask){
	this.rawTask = rawTask;	

	this.displayTitle = rawTask.title || rawTask.type;
}
