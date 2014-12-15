var HttpError = load('./httperror');

function ServerError(msg) {
    HttpError.call(this, 500, msg);
}
ServerError.prototype = new HttpError();
ServerError.prototype.name = "ServerError";

module.exports = ServerError;