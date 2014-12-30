var restify = require('restify');


var server = restify.createServer();

server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.use(restify.bodyParser());

module.exports = server;