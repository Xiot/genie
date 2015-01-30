angular.module('aladdin',[
	'ui.router',
	'ui.bootstrap',
	'symbiote.common',

	'aladdin.globals',
	'aladdin.layout',
	'aladdin.config',
	'aladdin.data',
	'aladdin.logging',
	'aladdin.sections',
	'aladdin.security',
	'aladdin.socket',

	'aladdin.dashboard',
	'aladdin.tasks',

	'aladdin.partials'
	]);