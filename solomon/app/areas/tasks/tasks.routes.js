angular.module('app.tasks')
	.run(appRun);

/* @ngInject */
function appRun(sectionManager) {

	sectionManager.register(getStates());

}

function getStates() {
	return [{
		name: 'tasks',
		url: '/tasks',
		controller: 'TaskListController',
		controllerAs: 'vm',
		templateUrl: 'app/areas/tasks/tasklist.html',
		settings: {
			module: true,
			order: 3,
			icon: ['glyphicon','glyphicon-tags']
		}
	}];
}