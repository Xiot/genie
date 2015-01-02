function RouteBuilder(server, baseRoute, baseHandlers) {

	var routesByName = {};
	var paramHandlers = {};

	this.param = function(name, handler) {
		paramHandlers[key] = handler;
	}


	this.get = function(name, route, handlers) {

	}

	function _paramMiddleware(req, res, next) {

		for(var key in paramHandlers){
			
			var value = req.params[key];
			if(!value)
				continue;

			paramHandlers[key](req, res, next, value);
		}
	}

	function _interceptor(def){

		var route = server.router.find()

		return function(req, res, next){

			

		}
	}

	function _add(name, method, route, handlers) {

		var def = {
			name: name,
			method: method,
			parent: null,
			route: route,
			handlers: [].slice.call(arguments, 3)
		};

		routesByName[name] = def;


		server[method]({name:name, path:route}, def.handlers);
	}

}

function RouteBuilderFactory(server) {
	server.route = function(server, baseRoute, baseHandlers) {
		return new RouteBuilder(server, baseRoute, baseHandlers);
	}
}

module.exports = RouteBuilderFactory;