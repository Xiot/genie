var HttpError = load('./httperror');

function NotFound(msg) {
    HttpError.call(this, 404, msg);

    this.name = 'NotFound';    
}
NotFound.prototype = new HttpError();
//NotFound.prototype.constructor = NotFound;

module.exports = NotFound;