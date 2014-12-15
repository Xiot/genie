var HttpError = load('./httperror');

function NotFound(msg) {
    HttpError.call(this, 404, msg);    
}
NotFound.prototype = new HttpError();
NotFound.prototype.name = "NotFound";
//NotFound.prototype.constructor = NotFound;

module.exports = NotFound;