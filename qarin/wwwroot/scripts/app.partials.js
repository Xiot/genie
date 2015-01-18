angular.module("qarin.partials", []).run(["$templateCache", function($templateCache) {$templateCache.put("app/areas/chat/chat.html","<form id=\"chat\" ng-submit=\"vm.send()\"><h1>Chat</h1><div class=\"product-box\" ng-if=\"vm.chat.product\">{{vm.chat.product.name}}</div><div class=\"chat-window\"><div class=\"message-pane\"><div ng-repeat=\"m in vm.chat.messages\" ng-class=\"{\'chat-bubble\': true, sent: m.sent, received: !m.sent}\"><span class=\"message-time\">{{m.time | date: \'medium\'}}</span><div class=\"message-body\">{{m.message}}</div></div></div><div class=\"chat-controls input-group\"><input type=\"text\" ng-model=\"vm.message\" class=\"form-control\"> <span class=\"input-group-btn\"><button type=\"submit\" class=\"btn btn-default\"><i class=\"glyphicon glyphicon-send\"></i></button></span></div></div></form>");
$templateCache.put("app/areas/chat/chatlist.html","<h1>Chats</h1><div><div ng-repeat=\"chat in vm.chats\" class=\"chat-log-list-item\"><a ui-sref=\"chat({id: chat._id})\"><h5>{{chat.users}}</h5><p>{{chat.lastMessage.message}}</p></a></div><div class=\"add-bubble\" ng-click=\"vm.create()\">+</div></div>");
$templateCache.put("app/areas/errors/error.html","<h1>An error has occurred</h1><pre>{{error | json}}</pre>");
$templateCache.put("app/areas/home/home.html","<div><h1>{{vm.store.organization.name}}</h1><div>{{vm.store.name}}</div><div class=\"vertical-button-container\"><button class=\"btn btn-lg btn-default btn-block\" ui-sref=\"search\">Self Help</button> <button class=\"btn btn-lg btn-default btn-block\" ui-sref=\"chat-list\">Chat</button> <button class=\"btn btn-lg btn-default btn-block\" ng-click=\"vm.requestHelp()\">Call an associate</button></div></div>");
$templateCache.put("app/areas/layout/header.html","<div class=\"top-bar\" ng-controller=\"HeaderController as vm\"><span class=\"pull-right\"><i class=\"glyphicon glyphicon-bell\"></i> <span class=\"badge\">{{vm.notifications.length}}</span></span><div class=\"brand\">genie</div></div>");
$templateCache.put("app/areas/layout/layout.html","<ui-view></ui-view>");
$templateCache.put("app/areas/notifications/notifications.html","<div class=\"alert notification-bar\" ng-if=\"current.message\">{{current.message}}</div>");
$templateCache.put("app/areas/products/product.html","<h2>Product Info</h2><div>{{vm.product.name}}</div><div>{{vm.product.description}}</div><button ng-click=\"vm.createChat()\">Ask About</button>");
$templateCache.put("app/areas/products/search.html","<h1>Search</h1><form ng-submit=\"vm.search()\" style=\"position: relative\"><div class=\"input-group\"><input type=\"text\" ng-model=\"vm.query\" class=\"form-control\"> <span class=\"input-group-btn\"><button type=\"submit\" class=\"btn btn-default\"><i class=\"glyphicon glyphicon-search\"></i></button></span></div><div class=\"search-results\"><div ng-repeat=\"p in vm.products\" class=\"product-box row\"><div class=\"col-md-3 image-container\"><img ng-src=\"{{p.imageUrl}}\"></div><div class=\"col-md-9\"><a ui-sref=\"product({productId: p._id})\"><h5 class=\"product-name\">{{p.name}}</h5><p class=\"product-description\">{{p.description}}</p></a></div></div></div></form>");}]);