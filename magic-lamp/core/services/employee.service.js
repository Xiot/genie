var mongoose = require('mongoose');
var User = mongoose.model('User');
var Promise = require('bluebird');

var _io = null;

var service = {
	init: init,
	setStatus: setStatus
};

module.exports = service;


function init(io) {
	_io = io;
}

async function setStatus(employeeId, status) {

	//var employeeId = employee.id || employee;

	var employee = await getEmployee(employeeId);

	employee.status = status;
	await employee.saveAsync();
	
	console.log('set status: ' + employee.username + ': ' + employee.status);

	_io.to('store:' + employee.store + ':employee')
		.emit('employee:status', {
			employee: employee
		});

	return employee;
}


function getEmployee(employee) {

	if (employee && employee.id)
		return Promise.resolve(employee);

	return User.findByIdAsync(employee);
}