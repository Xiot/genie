angular.module('aladdin.tasks')
	.factory('taskService', TaskService);

function TaskService(httpClient, storeService, securityService, socket, eventService) {

	var user = securityService.currentUser();
	var store = storeService.currentStore;

	var service = {
		accept: acceptTask,
		complete: completeTask,
		getAvailable: getAvailableTasks,

		postMessage: postMessage,
		getChat: getChat,

		on: addHandler
	}

	return service;

	function acceptTask(task) {

		var url = join('stores', store.id, 'tasks', task._id, 'assignee');
		var data = {
			employee: user._id
		};

		return httpClient.put(url, data)
			.then(function(res) {
				return res.data;
			});
	}

	function completeTask(task) {

	}

	function getAvailableTasks() {
		var url = '/stores/' + storeService.currentStore.id + '/tasks/open?employee=' + user._id;

		return httpClient.get(url)
			.then(function(res) {
				return res.data.map(function(t) {
					return new Task(t);
				});
			});
	}

	function postMessage(task, message) {
		var url = join('chat', task.chat, 'messages');
		return httpClient.post(url, {message: message})
		.then(function(res){
			return res.data;
		});
	}

	function getChat(task) {
		var url = join('chat', task.chat);
		return httpClient.get(url)
			.then(function(res) {
				return res.data;
			});
	}

	function addHandler(message, handler) {
		return eventService.on(message, function(e, d) {
			handler(d);
		});
	}

	function join() {
		var args = [].slice.call(arguments);
		return '/' + args.join('/');
	}
}

function Task(rawTask) {
	this.rawTask = rawTask;

	angular.extend(this, rawTask);

	this.displayTitle = rawTask.title || rawTask.type;
}