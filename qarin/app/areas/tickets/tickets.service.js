angular.module('qarin.tickets')
	.factory('ticketService', TicketService);

function TicketService(storeService, httpClient, util, socket){

	var store = storeService.current;

	var service = {
		create: createTicket,
		get: getTicket,
		on: addHandler,
		getOpen: getOpenTickets,
		cancel: cancelRequest
	};

	init();

	return service;

	function cancelRequest(ticket){
		if(!ticket)
			throw new Error('TicketService.cancelRequest requires a ticket.');

		var ticketId = ticket.id || ticket._id || ticket;
		var url = util.join('stores', store.id, 'tasks', ticketId, 'status');
		return httpClient.put(url, {status: 'aborted'})
		.then(function(res){
			return res.data;
		});
	}

	function getOpenTickets(){
		var url = util.join('stores', store.id, 'tasks', 'open');
		return httpClient.get(url)
		.then(function(res){
			return res.data;
		});
	}

	function getTicket(id){
		var url = util.join('stores', store.id, 'tasks', id);

		return httpClient.get(url)
		.then(function(res){
			return res.data;
		});
	}

	function createTicket(opts){
		var request = {
			//type: 'request',
			type: opts.type,
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
