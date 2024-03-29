﻿angular.module('app.dashboard', ['app.sections'])
    .run(appRun);

function appRun(sectionManager) {

    sectionManager.register(getStates());

}

function getStates() {
    return [
        {
            name: 'dashboard',
            url: '/',
            controller: 'DashboardController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/dashboard/dashboard.html',
            settings: {
                module: true,
                order: 1,
                icon: ['glyphicon', 'glyphicon-stats']
            }
        }
    ];
}
