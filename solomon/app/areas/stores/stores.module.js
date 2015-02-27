angular.module('app.stores', ['ui.router'])
.run(appRun);

/* @ngInject */
function appRun(sectionManager) {

    sectionManager.register(getStates());

}

function getStates() {
    return [
        {
            name: 'stores',
            url: '/stores',
            controller: 'StoresController',
            controllerAs: 'vm',
            templateUrl: 'app/areas/stores/stores.html',
            settings: {
                module: false,
                order: 2,
                icon: ['glyphicon', 'glyphicon-map-marker']
            }
        }
    ];
}