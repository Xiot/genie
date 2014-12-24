angular.module("qarin.partials", []).run(["$templateCache", function($templateCache) {$templateCache.put("app/areas/chat/chat.html","<form ng-submit=\"vm.send()\"><h1>{{vm.name}}</h1><div style=\"height: 300px\" id=\"chatLog\"><p ng-repeat=\"m in vm.messages\">{{m.from}}: {{m.message}}</p></div><input type=\"text\" name=\"message\" ng-model=\"vm.message\"> <button type=\"submit\">Send</button></form>");
$templateCache.put("app/areas/layout/layout.html","<ui-view></ui-view>");
$templateCache.put("app/areas/notifications/notifications.html","<div class=\"alert notification-bar\" ng-if=\"current.message\">{{current.message}}</div>");
$templateCache.put("app/areas/home/home.html","<div ng-if=\"searching\">Determining Current Store</div><div ng-if=\"!searching\"><div ng-if=\"searchError\"><span class=\"danger\">{{searchError}}</span></div><div ng-if=\"!searchError\"><h1>{{store.organization.name}}</h1><div>{{store.name}}</div><div><button class=\"btn btn-lg\" ui-sref=\"chat\">Chat</button> <button class=\"btn btn-lg\" ng-click=\"requestHelp()\">Request Help</button> <button class=\"btn btn-lg\">Find</button></div></div></div>");}]);