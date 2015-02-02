angular.module('aladdin.tasks')
	.controller('TaskController', TaskController);

function TaskController($scope, task, chat, taskService, productService) {

	var vm = angular.extend(this, {
		task: task,
		chat: chat,
		product: null,

		message: '',
		sendMessage: sendMessage,

		accept: acceptTask,
		complete: completeTask

	});

	init();

	function init() {
		var unbindMessage = taskService.on('chat:message', function(msg) {
			if (!vm.task || vm.task.chat !== msg.chat)
				return;

			vm.chat.messages.push(msg);
		});

		$scope.$on('$destroy', function() {
			unbindMessage();
		});

		if(task.product){
			productService.getById(task.product)
			.then(function(product){
				vm.product = product;
			});
		}
	}

	function sendMessage() {
		var messageToPost = vm.message;
		vm.message = "";
		return taskService.postMessage(vm.task, messageToPost)
			.then(function(msg) {
				msg.sent = true;
				vm.chat.messages.push(msg);
			});
	}

	function acceptTask() {
		return taskService.accept(vm.task)
			.then(function(accepted) {
				angular.extend(vm.task, accepted);
				vm.task.mine = true;
			});
	}

	function completeTask(){
		return taskService.complete(vm.task)
		.then(function(task){
			angular.extend(vm.task, task);			
		});
	}
}