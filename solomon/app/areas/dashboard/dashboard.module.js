angular.module('app.dashboard', ['app.sections'])
    .run(appRun);
//.config(function ($stateProvider) {

//    $stateProvider.state('root', {
//        url: '',
//        abstract: true,
//        template: '<div ui-view></div>'
//    });

//    $stateProvider.state('dashboard', {
//        url: '',
//        parent: 'root',
//        controller: 'DashboardController',
//        controllerAs: 'vm',
//        templateUrl: 'app/areas/dashboard/dashboard.html'
//    });

//});

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
                order: 1
            }
        }
    ];
}