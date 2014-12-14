function HttpError(statusCode, msg) {
    this.statusCode = statusCode;
    this.message = msg;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
    
    // Remove bluebird from the stack trace
    var s = /^    .+?\\bluebird\\.+$/gm;
    var newStackTrace = this.stack.replace(s, "");
    newStackTrace = newStackTrace.replace(/\n\n/g, "");
    this.stack = newStackTrace;

}
HttpError.prototype = new Error();
HttpError.prototype.constructor = HttpError;
HttpError.prototype.name = 'HttpError';

module.exports = HttpError;