angular.module('qarin.tickets')
	.factory('ticketService', TicketService);

function TicketService(storeService, httpClient, util){

	var store = storeService.current;

	var service = {
		create: createTicket,
		get: getTicket
	};

	init();

	return service;

	function getTicket(id){
		var url = util.join('stores', store.id, 'tasks', id);

		return httpClient.get(url)
		.then(function(res){
			return res.data;
		});
	}

	function createTicket(product){
		var request = {
			type: 'request'			
		};

		var url = util.join('stores', store.id, 'tasks');
		return httpClient.post(url, request)
			.then(function(res) {
				return res.data;
			});
	}

	function init(service){
		storeService.on('storeChanged', function(e, store){
			store = store;
		});
	}

}