import _ from 'lodash';
import wrap from './promiseRouter';
import Promise from 'bluebird';

class RouteBuilder {

	//_template = null;

	constructor(server, baseUri, middleware) {
		this._server = server;
		this._template = baseUri;

		this.middleware = (middleware || []).slice();
	}

	get template() {
		return this._template;
	}

	route(route) {

		var childRoute = this._urlJoin(this.template, route);

		return new RouteBuilder(this._server, childRoute, this.middleware);
	}

	param(name, handler) {
		this.use(this._paramMiddleware(name, handler));
		return this;
	}

	use(handler) {
		this.middleware.push(handler);
		return this;
	}

	/* Method Handlers */
	get(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('GET', args.route, args.name, args.handlers);
	}

	post(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('POST', args.route, args.name, args.handlers);
	}

	put(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('PUT', args.route, args.name, args.handlers);
	}

	patch(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('PATCH', args.route, args.name, args.handlers);
	}

	del(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('DELETE', args.route, args.name, args.handlers);
	}

	head(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('HEAD', args.route, args.name, args.handlers);
	}

	opts(route, name, ...handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments));
		return this._methodHandler('OPTIONS', args.route, args.name, args.handlers);
	}

	/* Private Methods */
	_methodHandler(method, route, name, handlers) {
		var args = this._extractRouteArgs([].slice.call(arguments, 1));

		var classMethod = this._getClassMethod(method);
		var url = this._urlJoin(this.template, route);

		var def = {
			path: url,
			name: args.name
		};

		var allHandlers = this._prepareHandlers(args.name, this.middleware, args.handlers);

		this._server[classMethod](def, allHandlers);
		return this;
	}

	_paramMiddleware(name, handler) {
		return function(req, res, next) {
			if (req.params && req.params[name]) {
				handler(req, res, next, req.params[name]);
			} else {
				next();
			}
		}
	}

	_prepareHandlers(name, middleware, handlers){
		var allHandlers = [];
		for(var h of middleware)
			allHandlers.push(h);

		for(var h of handlers){

			if(h.wrapped) {
				allHandlers.push(h);
				continue;
			}

			if(h.length === 1) {
				allHandlers.push(wrap(h));
				// if(h.name.startsWith('callee$')){
				// 	allHandlers.push(Promise.coroutine(h));
				// } else {
				// 	allHandlers.push(wrap(h));
				// }

				// if(name === 'gen-test'){
				// 	console.log(h.name);
				// 	console.log(name, h);
				// 	allHandlers.push(Promise.coroutine(h));
				// }
				// else {
				// 	allHandlers.push(wrap(h));
				// }
				continue;
			}
			allHandlers.push(h);
		}
		return allHandlers;
	}

	_extractRouteArgs(args) {

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
			handlers = args[handlerIndex];
		} else {
			handlers = args.slice(handlerIndex);
		}

		return {
			name: name,
			route: route,
			handlers: handlers
		};
	}

	_getHttpMethod(methodName) {
		var httpMethod = method;
		if (httpMethod === 'del')
			httpMethod = 'delete';
		if (httpMethod === 'opts')
			httpMethod = 'options';
		httpMethod = httpMethod.toUpperCase();
		return httpMethod;
	}

	_getClassMethod(httpMethod) {
		var classMethod = httpMethod.toLowerCase();
		if (classMethod === 'delete')
			classMethod = 'del';
		if (classMethod === 'options')
			classMethod = 'opts';

		return classMethod;
	}

	_paramArray(...args) {
		if (args.length === 1 && Array.isArray(args[0]))
			return args[0];

		return args;
	}


	_urlJoin(left, right) {

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
}

export default function initialize(server) {
	server.route = function(baseRoute) {
		return new RouteBuilder(server, baseRoute);
	}
}
