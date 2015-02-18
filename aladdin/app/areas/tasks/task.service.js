angular.module('aladdin.tasks')
	.factory('taskService', TaskService);

function TaskService(httpClient, storeService, securityService, socket, eventService) {

	var user = securityService.currentUser();
	var store = storeService.currentStore;

	var service = {
		accept: acceptTask,
		complete: completeTask,
		engaged: engaged,
		setStatus: setStatus,
		getAvailable: getAvailableTasks,

		postMessage: postMessage,
		getChat: getChat,

		getById: getById,
		on: addHandler
	};

	init();

	return service;

	function init() {
		socket.on('chat:message', function(data) {
			eventService.raise('chat:message', data);
		});
		socket.on('ticket:created', function(data) {
			var task = new Task(data);
			task.mine = !!task.mine;
			eventService.raise('ticket:created', task);
		});
	}

	function getById(id) {
		var url = join('stores', store.id, 'tasks', id);
		return httpClient.get(url)
			.then(function(res) {
				return new Task(res.data);
			});
	}

	function setStatus(task, status) {
		var url = join('stores', store.id, 'tasks', task._id, 'status');
		var body = {
			status: status
		};

		return httpClient.put(url, body)
			.then(function(res) {
				return new Task(res.data);
			});
	}

	function acceptTask(task) {
		return setStatus(task, 'assigned');
		// var url = join('stores', store.id, 'tasks', task._id, 'assignee');
		// var data = {
		// 	employee: user._id
		// };

		// return httpClient.put(url, data)
		// 	.then(function(res) {
		// 		return new Task(res.data);
		// 	});
	}

	function engaged(task) {
		return setStatus(task, 'engaged');
	}

	function completeTask(task) {
		return setStatus(task, 'complete');
		// var url = join('stores', store.id, 'tasks', task._id);
		// var patch = [{op: 'replace', path:'/complete', value: true}];
		// return httpClient.patch(url, patch)
		// .then(function(res){
		// 	return new Task(res.data);
		// });
	}

	function getAvailableTasks() {
		var url = '/stores/' + storeService.currentStore.id + '/tasks/open?employee=' + user._id;

		return httpClient.get(url, {cache: false})
			.then(function(res) {
				return res.data.map(function(t) {
					return new Task(t);
				});
			});
	}

	function postMessage(task, message) {
		var url = join('chat', task.chat, 'messages');
		return httpClient.post(url, {
				message: message
			})
			.then(function(res) {
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