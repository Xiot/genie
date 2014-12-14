var HttpError = load('./httperror');

function ServerError(msg) {
    HttpError.call(this, 500, msg);
    
    this.name = 'ServerError';
}
ServerError.prototype = new HttpError();
//NotFound.prototype.constructor = ServerError;

module.exports = ServerError;