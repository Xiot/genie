angular.module('aladdin.tasks')
	.controller('TaskController', TaskController);

function TaskController($scope, task, chat, taskService, productService) {

	var vm = angular.extend(this, {
		task: task,
		chat: chat,
		product: null,
		productDetails: [],

		message: '',
		sendMessage: sendMessage,

		accept: acceptTask,
		complete: completeTask,
		engage: engaged,
		abort: abortTask
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

			var data = [];
			if(vm.product.specs && task.productDetails){
				vm.product.specs.forEach(function(spec){
					if(task.productDetails[spec.name]){

						var specValue = angular.extend({}, spec, {value: task.productDetails[spec.name]});
						specValue.display = specValue.display || specValue.name;
						data.push(specValue);

						// data.push({
						// 	name: spec.name,
						// 	display: spec.display || spec.name,
						// 	value: task.productDetails[spec.name]
						// });
					}
				})
			}
			vm.productDetails = data;
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
		return setStatus('closed');
	}
	function engaged(task){
		return setStatus('engaged');
	}

	function abortTask(task){
		return setStatus('aborted');
	}
}
