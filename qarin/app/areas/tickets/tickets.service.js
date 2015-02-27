angular.module('qarin.tickets')
	.factory('ticketService', TicketService);

function TicketService(storeService, httpClient, util, socket){

	var store = storeService.current;

	var service = {
		create: createTicket,
		get: getTicket,
		on: addHandler
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

	function createTicket(opts){
		var request = {
			type: 'request',
			searchText: opts.searchText
		};

		opts = opts || {};

		if(opts.product){
			request.product= opts.product.id || opts.product._id || opts.product;
		}	

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

	function addHandler(message, handler){
		socket.on(message, handler);
		
		return function() {
			socket.removeListener(message, handler);
		};
	}
}