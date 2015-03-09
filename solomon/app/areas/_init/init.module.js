angular.module('app._init', ['app.sections'])
    .run(appRun);

function appRun(sectionManager) {

    sectionManager.register(getStates());

}

function getStates() {
    return [
        {
            name: 'init',
            url: '/init',
            controller: 'TestDataController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/_init/init.html',
            settings: {
                module: true,
                order: 4,
                icon: ['glyphicon', 'glyphicon-stats']
            }
        }
    ];
}
