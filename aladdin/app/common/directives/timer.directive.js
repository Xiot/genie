angular.module('aladdin')
.directive('timer', timerDirective);

function timerDirective($interval) {

	return {
		restrict: 'E',
		templateUrl: 'app/common/directives/timer.html',
		scope: {
			startTime: '='
		},
		link: linkFn
	};

	function linkFn(scope, element, attrs){

		var startMoment = moment(scope.startTime);
				
		var stop = $interval(function(){
			update()
		}, 1000);

		element.on('$destroy', function(){
			$interval.cancel(stop);
		});

		update();

		scope.$watch('startTime', function(){
			startMoment = moment(scope.startTime);
			update();
		});

		function update(){
			console.log('update');
			
			var diff = moment.utc().diff(startMoment);
			var duration = moment.duration(diff);

			var formatted = duration.format('h[h] mm[m] ss[s]');
			
			scope.formatted = formatted;
			scope.duration = {
				hours: Math.floor(duration.asHours()),
				minutes: duration.minutes(),
				seconds: duration.seconds()
			};
		}

	}
}