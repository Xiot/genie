angular.module("solomon.partials", []).run(["$templateCache", function($templateCache) {$templateCache.put("app/layout/shell.html","<div ng-controller=\"ShellController as vm\"><div class=\"top-bar\">Header</div><div><div class=\"side-bar\">sidebar<ul><li ng-repeat=\"item in vm.sections\">{{item.name}}</li></ul><a ui-sref=\"dashboard\">Dashboard</a></div><div ui-view class=\"content\">{{vm.message}}</div></div><div><pre>{{$state.current | json}}</pre></div></div>");
$templateCache.put("app/areas/dashboard/dashboard.html","Stuff<h2>Dashboard</h2>{{vm.message}}");}]);