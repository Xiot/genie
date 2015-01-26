

// exports = module.exports = function(io){

// 	return new CommunicationService(io);
// }

function CommunicationService(){

}

CommunicationService.prototype.init = function(io){
	this._io = io;
}

CommunicationService.prototype.send = function(user, data){

}

CommunicationService.prototype.getUser = function(){
	
}

var service = new CommunicationService();
module.exports = service;

exports['@singleton'] = true;
exports['@require'] = ['io'];