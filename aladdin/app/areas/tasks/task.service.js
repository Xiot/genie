angular.module('aladdin.tasks')
.factory('taskService', TaskService);

function TaskService(httpClient, storeService, securityService){

	var user = securityService.currentUser();
	var store = storeService.currentStore;

	var service = {
		accept: acceptTask,
		complete: completeTask,
		getAvailable: getAvailableTasks
	}
	return service;

	function acceptTask(task){
		// var op = [
		// 	{op: 'test', path: "/__v", value: task.__v},
		// 	{op: "replace", path: "/assigned_to", value:user._id}			
		// ];

		var url = join('stores', store.id, 'tasks', task._id, 'assignee');
		var data = {employee: user._id};

		return httpClient.put(url, data)
		.then(function(res){
			return res.data;
		});
	}

	function completeTask(task){

	}

	function getAvailableTasks(){
		var url = '/stores/' + storeService.currentStore.id + '/tasks/open?employee=' + user._id;

		return httpClient.get(url)
		.then(function(res){
			return res.data;
		});
	}

	function join(){
		var args = [].slice.call(arguments);
		return '/' + args.join('/');		
	}
}