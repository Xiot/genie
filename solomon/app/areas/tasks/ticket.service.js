angular.module('app.tasks')
	.factory('ticketService', TicketService);

function TicketService(httpClient, util, storeService, $q) {

	var _store = storeService.currentStore;

	var service = {
		getById: getById,
		getAllOpen: getAllOpen,
		getStats: getStats,
		assignTo: assignTicket
	};

	init();

	return service;

	function init() {
		storeService.on('storeChanged', function(e, store) {
			_store = store;
		});
	}

	function getById(id) {
		var url = util.join('stores', _store.id, 'tasks', id);
		return httpClient.get(url)
			.then(function(res) {
				return new Task(res.data);
			});
	}

	function getAllOpen() {

		if (!_store) {			
			return $q.when([]);
		}

		var url = util.join('stores', _store.id, 'tasks', 'open');
		return httpClient.get(url)
			.then(function(res) {
				return res.data.map(function(t){
					return new Task(t);
				});
			});
	}

	function assignTicket(ticket, employee){
		var url = util.join('stores', _store.id, 'tasks', ticket.id, 'assignee');
		return httpClient.put(url, {employee: employee.id})
		.then(function(res){
			return res.data;
		});
	}

	function getStats(){
		if(!_store)
			return  $q.when([]);
		
		var url = util.join('stores', _store.id, 'tasks', 'stats');
		return httpClient.get(url)
		.then(function(res){

			var order = ['unassigned', 'assigned', 'engaged', 'complete'];
			
			var stats = _.sortBy(res.data, function(item){
				var index = order.indexOf(item.status);
				if(index === -1)
					index = 100;
				return index;
			});

			return stats;
		});
	}
}


function Task(rawTask) {
	this.rawTask = rawTask;

	angular.extend(this, rawTask);

	this.displayTitle = rawTask.title || rawTask.type;
}