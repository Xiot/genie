angular.module('app.employees')
.run(configureRoutes);

// @ngInject
function configureRoutes(sectionManager){
	sectionManager.register(getRoutes());
}

function getRoutes(){
	return [{
		name: 'employees',
		url: '/employees',
		controller: 'EmployeesController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/employees/employees.html',
		settings: {
			module: true,
			order: 4,
			icon: ['fa', 'fa-users']
		}
	}];
}