angular.module('aladdin.tasks')
.run(configureRoutes);

function configureRoutes(sectionManager){
	sectionManager.register(getStates());
}

function getStates() {
    return [
        {
            name: 'tasks',
            url: '/tasks',
            controller: 'TaskListController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/tasks/tasks.html',
            settings: {
                module: true,
                order: 2,
                icon: ['glyphicon', 'glyphicon-tag']
            }
        }
    ];
}