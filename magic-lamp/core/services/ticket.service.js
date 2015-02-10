var mongoose = require('mongoose');
var Task = mongoose.model('Task');
var User = mongoose.model('User');
var Promise = require('bluebird');

var employeeService = load('~/core/services/employee.service');

var _io;

var service = {
	init: init,
	assignTicket: assignTicket
};


module.exports = service;

function init(socket){
	_io = socket;
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
			task: task
		});
	}).then(function(){
		return ticket;
	});

	// var p = [getTicket(task), getEmployee(employee)];

	// Promise.all(p)
	// 	.then(function(values) {
	// 		employee = values[0];
	// 		task = values[0];
	// 	});		
}

function getEmployee(employee) {

	if (employee && employee.id)
		return Promise.resolve(employee);

	//if(isObjectId(employee))

	return User.findByIdAsync(employee);
}

function getTicket(task) {
	if (task && task.id)
		return Promise.resolve(task);

	return Task.findByIdAsync(task);
}

function isObjectId(n) {
	return mongoose.Types.ObjectId.isValid(n);
}