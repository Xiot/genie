angular.module('aladdin.tasks')
	.controller('TaskListController', TaskListController);

// @ngInject
function TaskListController($scope, taskService, securityService) {

	var vm = angular.extend(this, {
		tasks: null,
		selected: null,
		select: selectTask,
		accept: acceptTask,
		complete: completeTask,
		chat: null,
		sendMessage: sendChatMessage
	});

	init();

	function init() {
		taskService.getAvailable()
			.then(function(tasks) {

				vm.tasks = tasks;

				if (vm.tasks.length > 0)
					vm.select(vm.tasks[0]);
			});

		var unbindCreated = taskService.on('ticket:created', function(ticket){
			vm.tasks.unshift(ticket);
		});

		var unbindMessage = taskService.on('chat:message', function(msg){
			if(!vm.selected || ticket.chat !== msg.chat)
				return;

			vm.selected.messages.push(msg);
		});

		$scope.$on('$destroy', function(){
			unbindCreated();
			unbindMessage();
		});
	}

	function selectTask(task) {
		vm.tasks.forEach(function(t) {
			t.selected = false;
		});
		task.selected = true;
		vm.selected = task;

		return taskService.getChat(task)
		.then(function(chat){
			vm.chat = chat;
		});
	}

	function sendChatMessage(task, message){
		vm.message = "";
		
		return taskService.postMessage(task, message)
		.then(function(msg){
			msg.sent = true;
			vm.chat.messages.push(msg);
		});
	}

	function acceptTask(task) {

		task = task || vm.selected;

		return taskService.accept(task)
			.then(function(retVal) {

				angular.extend(task, retVal);
				task.mine = true;
			});
	}

	function completeTask(task) {

	}
}
