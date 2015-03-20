var mongoose = require('mongoose');
var Task = mongoose.model('Task');
var User = mongoose.model('User');
var Promise = require('bluebird');

var employeeService = load('~/core/services/employee.service');

var _io;

var service = {
	init: init,
	assignTicket: assignTicket,
	get: getTicket,
	saveAsync: saveTicket
};


module.exports = service;

function init(socket){
	_io = socket;
}

async function saveTicket(ticket){
	await ticket.saveAsync();

	var group = getTicketChannels(ticket);
	group.emit('ticket:updated', ticket);
	return ticket;
}

function assignTicket(employeeId, taskId) {

	var ticket = null;
	var employee = null;

	return Promise.props({
		employee: getEmployee(employeeId),
		ticket: getTicket(taskId)
	})
	.then(function(ret){
		ticket = ret.ticket;
		employee = ret.employee;

		ticket.status = 'assigned';
		ticket.assigned_to = ret.employee;

		return ticket.saveAsync();

	// }).spread(function(t){
	// 	ticket = t;
	// 	return employeeService.setStatus('busy');

	}).then(function(){
		_io.to(ticket.customer)
		.emit('task:assigned', {
			employee: employee,
			ticket: ticket
		});
	}).then(function(){
		return ticket;
	});

}

function getEmployee(employee) {

	if (employee && employee.id)
		return Promise.resolve(employee);

	//if(isObjectId(employee))

	return User.findByIdAsync(employee);
}

function getTicket(task) {
	if (task instanceof Task)
		return Promise.resolve(task);

	return Task.findById(task)
		.populate('product')
		.populate('assigned_to')
		.execAsync();
}

function isObjectId(n) {
	return mongoose.Types.ObjectId.isValid(n);
}

function getTicketChannels(ticket){
	var channel = _io
		.to(`solomon:${ticket.store}`)
		.to(`aladdin:${ticket.store}`);

	if(ticket.customer)
		channel = channel.to(ticket.customer);

	return channel;
}
