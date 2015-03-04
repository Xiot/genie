var Promise = require('bluebird');

var wrap = function(handler) {

	var wrapper = function(req, res, next) {

		var nextReason;

		var takesNext = handler.length >= 3;

		var promiseNext = function(reason) {
			nextReason = reason;

			if (takesNext) {
				next(reason);
			}
		};


		// TODO: Should look at how many parameters the handler has
		// and throw an error if the method returns undefined and they dont have next

		try {

			var ret = handler(req, res, promiseNext);

			ret = normalizeToPromise(ret);
			// if (isIterator(ret)) {
			// 	console.log('iterator returned');

			// 	//ret = runGenerator(ret);
			// 	ret = iteratorToPromise(ret)();
			// }

			if (isPromise(ret)) {
				console.log('promise returned');

				// if (!ret.catch) {
				// 	ret = new Promise(function(resolve, reject) {
				// 		ret.then(resolve, reject);
				// 	});
				// }

				ret.then(function(value) {

					// check if value is a response object
					// if then then write it out to the actual response

					// Promisified Mongoose saveAsync returns an array with [value, recordsAffected]
					// if we get this, then just return the value;
					if (Array.isArray(value) && value.length == 2 && typeof value[1] === 'number')
						value = value[0];

					res.send(value);
					next();

				}).catch(function(ex) {
					//console.log(ex);

					if (!(ex instanceof Error)) {
						ex = new Error(ex);
					}

					//res.send(400, ex);
					//next();
					next(ex);
				});
			} else if (isError(ret)) {
				next(ret);

			} else {

				if (ret === undefined) {
					if (!takesNext) {
						return next(new Error('The handler for route \'' + req.route.method + ' ' + req.route.path + '\' did not return a value and did not accept the `next` argument.'));
					}
					next();

				} else if (ret === null) {
					next(404, "Not Found");
				} else {
					res.send(ret);
					next();
				}

				//next(nextReason);
			}

		} catch (ex) {
			console.log('exception: ', ex);
			console.log(ex.stack);
			//console.log(ex);
			next(ensureError(ex));
			return;
		}
	}

	wrapper.wrapped = true;
	return wrapper;

}

function normalizeToPromise(ret) {
	if (isIterator(ret)) {
		console.log('iterator returned');

		//ret = runGenerator(ret);
		return iteratorToPromise(ret)();
	}

	if (isPromise(ret) && !ret.catch) {
		return new Promise(function(resolve, reject) {
			ret.then(resolve, reject);
		});
	}

	if(isError(ret)){
		return new Promise(function(resolve, reject){
			reject(ret);
		});
	}

	return ret;
}

function isError(ex) {
	return ex instanceof Error;
}

function ensureError(ex) {
	if (!(ex instanceof Error)) {
		ex = new Error(ex);
	}
	return ex;
}

function isPromise(obj) {
	return obj && typeof(obj) === 'object' && obj.then !== undefined;
}

function isGenerator(fn) {
	return fn && fn.name.startsWith('callee$');
}

function isIterator(obj) {
	return obj && typeof(obj) === 'object' && typeof obj.next === 'function' && typeof obj.throw === 'function';
}



// https://www.promisejs.org/generators/
function iteratorToPromise(generator) {
	return function() {
		//var generator = makeGenerator.apply(this, arguments);

		function handle(result) {
			// result => { done: [Boolean], value: [Object] }
			if (result.done) return Promise.resolve(result.value);

			return Promise.resolve(result.value).then(function(res) {
				return handle(generator.next(res));
			}, function(err) {
				return handle(generator.throw(err));
			});
		}

		try {
			return handle(generator.next());
		} catch (ex) {
			return Promise.reject(ex);
		}
	}
}


module.exports = wrap;