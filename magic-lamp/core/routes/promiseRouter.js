var Promise = require('bluebird');

var wrap = function(handler) {

	return function(req, res, next) {

		var nextReason;

		var takesNext = handler.length >= 3;

		var promiseNext = function(reason) {
			nextReason = reason;

			if(takesNext){
				next(reason);
			}
		};


		// TODO: Should look at how many parameters the handler has
		// and throw an error if the method returns undefined and they dont have next

		try {
			var ret = handler(req, res, promiseNext);

			if (isPromise(ret)) {

				ret.then(function(value) {

					// check if value is a response object
					// if then then write it out to the actual response
					
					// Promisified Mongoose saveAsync returns an array with [value, recordsAffected]
					// if we get this, then just return the value;
					if(Array.isArray(value) && value.length == 2 && typeof value[1] === 'number')
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
			} else if(isError(ret)){
				next(ret);

			} else {

				if(ret === undefined){
					if(!takesNext){
						return next(new Error('The handler for route \'' + req.route.method + ' ' + req.route.path + '\' did not return a value and did not accept the `next` argument.'));
					}
					next();

				} else if(ret === null){
					next(404, "Not Found");
				} else {
					res.send(ret);
					next();
				}

				//next(nextReason);
			}

		} catch (ex) {
			console.log('exception: ',ex);
			console.log(ex.stack);
			//console.log(ex);
			next(ensureError(ex));
			return;
		}
	}
}

function isError(ex){
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

module.exports = wrap;