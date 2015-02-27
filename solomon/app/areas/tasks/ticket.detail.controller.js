angular.module('app.tasks')
.controller('TicketDetailController', TicketDetailController);

function TicketDetailController(ticket, ticketService, util, httpClient) {

	var vm = angular.extend(this, {
		ticket: ticket,
		assignTo: assignToEmployee,
		availableEmployees: []
	}); 
	
	init();

	function init(){
		updateTimeSince(vm.ticket);
		getAvailableEmployees();
	}

	function getAvailableEmployees(){
		var url = util.join('stores', vm.ticket.store, 'employees') + '?available=true';
		if(vm.ticket.department)
			url += '&department=' + vm.ticket.department;

		return httpClient.get(url)
		.then(function(res){
			vm.availableEmployees = res.data;
		});
	}

	function updateTimeSince(task){
		task.timeSince = task.timings && task.timings[task.status] ? task.timings[task.status].start : task.created_at;
	}

	function assignToEmployee(employee){
		return ticketService.assignTo(vm.ticket, employee)
		.then(function(updated){
			vm.ticket = updated;
			updateTimeSince(vm.ticket);
		});
	}
}