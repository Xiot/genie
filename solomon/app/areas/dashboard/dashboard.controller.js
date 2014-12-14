
angular.module('app.dashboard')
    .controller('DashboardController', DashboardController);

// @ngInject
function DashboardController() {
    this.message = "Hello World";
}