var url = require('url');
var debug = require('debug')('magic-lamp-router');


/*
	TODO: Rename SubRouteBuilder -> RouteBuilder
		extract the [method] call into a 'register' method
	Rename RouteBuilder -> RootRouteBuilder
	RootRouteBuilder should extend RouteBuilder and override the register method

	Wrap the handlers in a try-catch.
	Allow them to return promises.
	 - Automatically call next() when promise resolves;
*/

var serverMethods = [
	'del',
	'get',
	'head',
	'opts',
	'post',
	'put',
	'patch'
];

function RouteBuilder(server, baseRoute, middleware) {
	this.server = server;
	this.baseRoute = baseRoute;

	if (!Array.isArray(middleware)) {
		middleware = [].slice.call(arguments, 2);
	}

	this.middleware = middleware || [];

	this.routesByName = {};
	//debug('base: ' + this._buildUrl('/'));
};

RouteBuilder.prototype.param = function(name, handler) {

	// try{
	// 	this.server.param(name, handler);
	// } catch(ex){
	// 	console.log(ex);
	// }
	this.use(function(req, res, next) {

		debug('route: ' + JSON.stringify(req.route));

		debug('', req.params);
		if (req.params && req.params[name]) {
			handler(req, res, next, req.params[name]);
		} else {
			next();
		}
	});
	return this;
};

RouteBuilder.prototype.use = function(handler) {

	this.middleware.push(handler);
	//this.server.use(handler);
	return this;
};

//['get','post','delete','patch','options','head']


serverMethods.forEach(function(method) {

	RouteBuilder.prototype[method] = function(route, name, handlers) {

		var args = extractRouteArgs([].slice.call(arguments, 0));
		route = args.route;
		name = args.name;
		handlers = args.handlers;

		var httpMethod = method;
		if (httpMethod === 'del')
			httpMethod = 'delete';
		if (httpMethod === 'opts')
			httpMethod = 'options';
		httpMethod = httpMethod.toUpperCase();

		var routeUrl = this._buildUrl(route);

		var def = {
			name: name,
			method: httpMethod,
			parent: this.server,
			route: routeUrl,
			handlers: handlers
		};

		this.routesByName[name] = def;

		var handlers = this.middleware.concat(def.handlers);

		//debug(handlers);

		this.server[method]({
			name: name,
			path: def.route
		}, handlers);

		// debug(httpMethod + ' ' + routeUrl + ' [' + handlers.length + ']');

		// if(method === 'patch')
		// 	debug('', handlers[0], handlers[1], handlers[2]);

		return this;
	};
});

// 	this[method] = function(route, name, handlers) {
// 		_add(method, route, name, handlers);
// 		return this;
// 	}
// })

RouteBuilder.prototype.route = function(route) {

	//var subRoute = urlJoin(this.baseRoute, route);
	//debug('route.new: ' + subRoute);
	var subRoute = this._buildUrl(route);
	//debug('route.new: ' + subRoute);

	return new SubRouteBuilder(this, route, this.middleware);
	//return new SubRouteBuilder(this, route, this.middleware);	
};

RouteBuilder.prototype._baseUrl = function() {

	if (!this.server._baseUrl)
		return this.baseRoute;

	var parentRoute = this.server._baseUrl();
	var url = urlJoin(parentRoute, this.baseRoute);
	return url;
}

RouteBuilder.prototype._buildUrl = function(route) {

	var baseUrl = this._baseUrl();
	var url = urlJoin(baseUrl, route);
	return url;

	// var parentRoute = this.server.baseRoute;

	// var url = urlJoin(parentRoute, this.baseRoute);
	//url = urlJoin(url, route);
	//return url;

	//return urlJoin(parentRoute, route);
}

function SubRouteBuilder(builder, route, middleware) {
	this.builder = builder;
	this.baseRoute = route;

	if (!Array.isArray(middleware)) {
		middleware = [].slice.call(arguments, 2);
	}

	this.middleware = middleware;
}

SubRouteBuilder.prototype.param = function(name, handler) {
	this.use(paramHandler(name, handler));
	return this;
}

SubRouteBuilder.prototype.use = function(handler) {
	this.middleware.push(handler);
	return this;
}

serverMethods.forEach(function(method) {

	SubRouteBuilder.prototype[method] = function(route, name, handlers) {

		// if (!Array.isArray(args))
		// 	args = [].slice.call(arguemnts, 2);
		var args = extractRouteArgs([].slice.call(arguments, 0));

		var relativeRoute = urlJoin(this.baseRoute, args.route);

		this.builder[method](relativeRoute, args.name, args.handlers);
		return this;
	};

});


SubRouteBuilder.prototype.route = function(route) {
	return new SubRouteBuilder(this, route, this.middleware);
}
SubRouteBuilder.prototype._baseUrl = function() {

	if (!this.builder._baseUrl)
		return this.baseRoute;

	var parentRoute = this.builder._baseUrl();
	var url = urlJoin(parentRoute, this.baseRoute);
	return url;
}

SubRouteBuilder.prototype._buildUrl = function(route) {

	var baseUrl = this._baseUrl();
	var url = urlJoin(baseUrl, route);
	return url;

	// var parentRoute = this.server.baseRoute;

	// var url = urlJoin(parentRoute, this.baseRoute);
	//url = urlJoin(url, route);
	//return url;

	//return urlJoin(parentRoute, route);
}

function extractRouteArgs(args) {

	if (args.length < 2)
		throw new Error('invalid arguments');

	var first = args[0];
	var second = args[1];
	var name, route;

	var handlerIndex = 2;

	if (typeof first === 'object') {
		route = first.path;
		name = first.name;
		handlerIndex = 1;

	} else if (typeof first === 'string') {
		route = first;

	} else {
		throw new Error('invalid arguments. route');
	}

	if (typeof second === 'string' || typeof second === 'undefined') {
		name = second;
	} else {
		handlerIndex = 1;
	}

	var handlers = [];

	if (Array.isArray(args[handlerIndex])) {
		handlers = args[handlerIndex]
	} else {
		handlers = args.slice(handlerIndex);
	}

	return {
		name: name,
		route: route,
		handlers: handlers
	};
}

function paramHandler(name, handler) {
	return function(req, res, next) {

		// debug('param: ' + name + ' value: ' + req.params);
		if (req.params && req.params[name]) {
			handler(req, res, next, req.params[name]);
		} else {
			next();
		}
	}
}


function RouteBuilderFactory(server) {
	server.route = function(baseRoute) {
		return new RouteBuilder(server, baseRoute);
	}
}

module.exports = RouteBuilderFactory;

function urlJoin(left, right) {

	if (!left)
		return right;

	var uri = left;
	if (uri.substr(-1) === '/')
		uri = url.slice(0, -1);

	if (right[0] !== '/')
		right += '/';

	if (right.length > 1)
		uri += right;

	return uri;
}
