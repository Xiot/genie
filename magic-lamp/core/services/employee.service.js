var mongoose = require('mongoose');
var User = mongoose.model('User');

var _io = null;

var service = {
	init: init,
	setStatus: setStatus
};

module.exports = service;


function init(io){
	_io = io;
}

function setStatus(employee, status){

	//var employeeId = employee.id || employee;

	employee.status = status;
	return employee.saveAsync()
	.spread(function(emp){
		_io.to('store:' + emp.store + ':employee')
		.emit('employee:status', {employee: emp});
		return emp;
	})

	// return User.updateAsync({status: status}, {_id: employee})
	// .then(function(user){
	// 	_io.to('store:' + )
	// })

}