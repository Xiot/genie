
module.exports = function(schema, opts){
	
	var server = opts.server;

	var links = opts.links;

	links.forEach(function(link){
		schema.virtual('href').get(function(){

		}
	});	
}