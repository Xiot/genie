angular.module('aladdin.dashboard', ['aladdin.sections'])
    .run(appRun);
// .config(function ($stateProvider) {

  
//    $stateProvider.state('dashboard', {
//        url: '/',
//        parent: 'app-root',
//        controller: 'DashboardController',
//        controllerAs: 'vm',
//        templateUrl: 'app/areas/dashboard/dashboard.html'
//    });

// });

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