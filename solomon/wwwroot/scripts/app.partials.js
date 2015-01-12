angular.module("solomon.partials", []).run(["$templateCache", function($templateCache) {$templateCache.put("app/layout/header.html","<div class=\"top-bar\" ng-controller=\"HeaderController as vm\"><div class=\"brand\">genie</div><div class=\"selections pull-left\"><select ng-model=\"vm.org\" ng-options=\"item.name for item in vm.orgs track by item._id\"></select><select ng-model=\"vm.store\" ng-options=\"item.name for item in vm.stores track by item.id\"></select>{{vm.org.name}} -> {{vm.store.name}}</div><div class=\"pull-right\"><a class=\"avatar\"><span>{{vm.user.username}}</span> <i class=\"fa fa-user\"></i></a></div></div>");
$templateCache.put("app/layout/shell.html","<div ng-controller=\"ShellController as vm\"><div ng-include=\"\'app/layout/header.html\'\"></div><div class=\"float-container\"><div class=\"side-bar\" ng-include=\"\'app/areas/aside/aside.html\'\"></div><div ui-view class=\"content\">{{vm.message}}</div></div></div>");
$templateCache.put("app/areas/aside/aside.html","<aside ng-controller=\"AsideController as vm\">sidebar<ul class=\"nav\"><li ng-repeat=\"item in vm.sections\"><a ui-state=\"item.name\" ui-state-active=\"active\"><i ng-class=\"item.settings.icon\"></i> <span class=\"sidebar-label\">{{item.name}}</span></a></li></ul></aside>");
$templateCache.put("app/areas/chat/chat-list.html","<h1>Chats</h1><div><div ng-repeat=\"c in vm.chats\" class=\"chat-window\"><div class=\"message-pane\"><div ng-repeat=\"m in c.messages\" ng-class=\"{\'chat-bubble\': true, sent: m.sent, received: !m.sent}\"><span class=\"message-time\">{{m.time | date: \'medium\'}}</span><div class=\"message-body\">{{m.message}}</div></div></div><div class=\"input-group\"><input type=\"text\" ng-model=\"c.currentMessage\" class=\"form-control\"> <span class=\"input-group-btn\"><button ng-click=\"vm.sendMessage(c, c.currentMessage);\" class=\"btn btn-default\"><i class=\"glyphicon glyphicon-send\"></i></button></span></div></div></div>");
$templateCache.put("app/areas/dashboard/dashboard.html","Stuff<h2>Dashboard</h2>{{vm.message}}");
$templateCache.put("app/areas/employees/employees.html","<h2>employees</h2><div><div ng-repeat=\"emp in vm.employees\"><span>{{emp.firstName}} {{emp.lastName}}</span></div><pre>{{vm.employees | json}}</pre></div>");
$templateCache.put("app/areas/stores/stores.html","<div class=\"clearfix\"><div class=\"store-list\"><h2>Stores</h2><div><div ng-repeat=\"store in vm.stores\" class=\"store-badge\"><a ng-click=\"vm.select(store)\"><div class=\"org-label\">{{store.organization.name}}</div><div class=\"store-label\">{{store.name}}</div><div>{{store.address.city}}, {{store.address.state}}</div></a></div></div></div><div class=\"store-info\"><h1>{{vm.selected.organization.name}}</h1><h2>{{vm.selected.name}}</h2><h2>Tasks</h2><div><div ng-repeat=\"task in vm.tasks\" class=\"task-badge {{task.type}}\" ng-class=\"{complete: task.complete}\"><span>{{task.title}}</span></div></div></div></div>");
$templateCache.put("app/areas/login/login.html","<div id=\"login\"><div class=\"login-box\"><div class=\"login-header\"><h1>genie</h1></div><div class=\"ribbon ribbon-fold-left ribbon-fold-right\"><h2>login</h2></div><form name=\"form\" class=\"form-validation\"><div class=\"text-danger wrapper text-center\" ng-show=\"vm.message\">{{vm.message}}</div><div class=\"list-group list-group-sm\"><div class=\"list-group-item\"><input type=\"text\" placeholder=\"Username\" class=\"form-control no-border\" ng-model=\"vm.login.username\" required></div><div class=\"list-group-item\"><input type=\"password\" placeholder=\"Password\" class=\"form-control no-border\" ng-model=\"vm.login.password\" required></div><div class=\"list-group-item\"><input type=\"checkbox\" ng-model=\"vm.login.rememberMe\">Remember me?</div></div><button type=\"submit\" class=\"btn btn-lg btn-primary\" ng-click=\"vm.login()\" ng-disabled=\"form.$invalid\">Log in <i class=\"fa fa-lock\"></i></button><div class=\"text-center m-t m-b\"><a ui-sref=\"access.forgotpwd\">Forgot password?</a></div></form></div></div>");
$templateCache.put("app/areas/tasks/tasklist.html","<h2>Tasks</h2><div><div ng-repeat=\"task in vm.tasks\" class=\"task-badge {{task.type}}\" ng-class=\"{complete: task.complete}\"><span>{{task.title}}</span></div></div>");}]);