var url = require('url');
var debug = require('debug')('magic-lamp-router');

function RouteBuilder(server, baseRoute) {
	this.server = server;
	this.baseRoute = baseRoute;

	this.routesByName = {};
	debug(baseRoute);
};

//	var routesByName = {};
//var paramHandlers = {};

RouteBuilder.prototype.param = function(name, handler) {

	// try{
	// 	this.server.param(name, handler);
	// } catch(ex){
	// 	console.log(ex);
	// }
	this.server.use(function(req, res, next) {

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
	this.server.use(handler);
	return this;
};

//['get','post','delete','patch','options','head']


[
	'del',
	'get',
	'head',
	'opts',
	'post',
	'put',
	'patch'
].forEach(function(method) {

	RouteBuilder.prototype[method] = function(route, name, handlers) {

		var args = [].slice.call(arguments, 1);

		var httpMethod = method;
		if (httpMethod === 'del')
			httpMethod = 'delete';
		if (httpMethod === 'opts')
			httpMethod = 'options';
		httpMethod = httpMethod.toUpperCase();

		var subRoute = urlJoin(this.baseRoute, route);

		var def = {
			name: name,
			method: method,
			parent: null,
			route: subRoute,
			handlers: [].slice.call(arguments, 2)
		};

		this.routesByName[name] = def;

		this.server[method]({
			name: name,
			path: def.route
		}, def.handlers);

		debug(httpMethod + ' ' + subRoute);

		return this;
	};
});

// 	this[method] = function(route, name, handlers) {
// 		_add(method, route, name, handlers);
// 		return this;
// 	}
// })

RouteBuilder.prototype.route = function(route) {

	var subRoute = urlJoin(baseRoute, route);

	return new RouteBuilder(server, subRoute);
};

// function _add(method, route, name, handlers) {

// 	var args = [].slice.call(arguments, 1);


// 	var def = {
// 		name: name,
// 		method: method,
// 		parent: null,
// 		route: route,
// 		handlers: [].slice.call(arguments, 3)
// 	};

// 	routesByName[name] = def;


// 	server[method]({
// 		name: name,
// 		path: route
// 	}, def.handlers);
// }

//}

function RouteBuilderFactory(server) {
	server.route = function(baseRoute) {
		return new RouteBuilder(server, baseRoute);
	}
}

module.exports = RouteBuilderFactory;

function urlJoin(left, right){
	var uri = left;
	if (uri.substr(-1) === '/')
		uri = url.slice(0, -1);

	if (right[0] !== '/')
		right += '/';

	if (right.length > 1)
		uri += right;

	return uri;
}