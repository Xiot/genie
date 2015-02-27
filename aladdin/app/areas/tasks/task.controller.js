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
		complete: completeTask,
		engage: engaged,		
	});

	init();

	function init() {

		updateTimeSince(vm.task);

		var unbindMessage = taskService.on('chat:message', function(msg) {
			if (!vm.task || vm.task.chat !== msg.chat)
				return;

			vm.chat.messages.push(msg);
		});

		$scope.$on('$destroy', function() {
			unbindMessage();
		});
 
		if(task.product){
			vm.product = task.product;
			// productService.getById(task.product)
			// .then(function(product){
			// 	vm.product = product;
			// });
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

	function updateTimeSince(task){
		task.timeSince = task.timings && task.timings[task.status] ? task.timings[task.status].start : task.created_at;
	}

	function setStatus(status){
		var changeTime = Date.now();
		return taskService.setStatus(vm.task, status)
			.then(function(retVal) {

				angular.extend(vm.task, retVal);
				vm.task.mine = true;
				vm.task.timeSince = changeTime;
				updateTimeSince(vm.task);
			});
	}

	function acceptTask() {
		return setStatus('assigned');
	}

	function completeTask(task) {
		return setStatus('complete');
	}
	function engaged(task){
		return setStatus('engaged');
	}
}