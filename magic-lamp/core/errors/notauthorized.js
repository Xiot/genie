var HttpError = load("./httperror");
var util = require('util');

function NotAuthorized(msg){
    HttpError.call(this, 401, msg);
}
util.inherits(NotAuthorized, HttpError);
//NotAuthorized.prototype = new HttpError();
NotAuthorized.prototype.name = "NotAuthorized";
module.exports = NotAuthorized;