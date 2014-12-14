angular.module('app.layout')
    .controller('ShellController', ShellController);

/* @ngInject */
function ShellController(sectionManager) {

    var vm = this;
    vm.sections = sectionManager.getModules();

}