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

function setStatus(employeeId, status) {

	//var employeeId = employee.id || employee;

	return getEmployee(employeeId)
		.then(function(employee) {

			employee.status = status;
			return employee.saveAsync()
				.spread(function(emp) {
					console.log('set status: ' + employee.username + ': ' + employee.status);
					
					_io.to('store:' + emp.store + ':employee')
						.emit('employee:status', {
							employee: emp
						});
					return emp;
				})
		})


	// return User.updateAsync({status: status}, {_id: employee})
	// .then(function(user){
	// 	_io.to('store:' + )
	// })

}


function getEmployee(employee) {

	if (employee && employee.id)
		return Promise.resolve(employee);

	return User.findByIdAsync(employee);
}