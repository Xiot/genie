angular.module('app.layout')
	.controller('AsideController', AsideController);

/* @ngInject */
function AsideController(sectionManager) {

	var vm = angular.extend(this, {
		sections: sectionManager.getModules()
	});

	//vm.sections = sectionManager.getModules();
}