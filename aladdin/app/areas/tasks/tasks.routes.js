angular.module('aladdin.tasks')
    .run(configureRoutes);

function configureRoutes(sectionManager) {
    sectionManager.register(getStates());
}

function getStates() {
    return [{
            name: 'tasks',
            url: '/tasks',
            controller: 'TaskListController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/tasks/tasks.html',
            settings: {
                module: true,
                order: 2,
                icon: ['glyphicon', 'glyphicon-tag'],
                displayName: 'Tickets'
            },
            resolve: {
                stuff: function($state, $stateParams){
                    return $state;
                }
            }
        },
        {
            name: 'task-details',
            url: '/tasks/:taskId',
            controller: 'TaskController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/tasks/task-details.html',
            resolve: {
                task: function(taskService, $stateParams){
                    var id = $stateParams.taskId;
                    return taskService.getById(id);
                },
                chat: function(task, taskService){
                    var chat = taskService.getChat(task);
                    return chat;
                }
            }
        }
    ];
}