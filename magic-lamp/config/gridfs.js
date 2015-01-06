var grid = require('gridfs-stream');
var Promise = require('bluebird');
//var ObjectID = mongoose.mongo.BSONPure.ObjectID

Promise.promisifyAll(grid);

function MongooseFiles(mongoose){

	var gfs = grid(mongoose.connection.db, mongoose.mongo);
	Promise.promisifyAll(gfs);

	this.get = function(id){
		return gfs.files.findAsync({_id: id});
	}

	this.put = function(data, fileStream){

		//if(!data.id)
		//	data.id = new ObjectID();

		return new Promise(function(resolve, reject){

			var stream = gfs.createWriteStream(data);			
			stream.on('close', function(file){
				resolve(file);
			});

			fileStream.pipe(stream);

			//return stream;
		});		
	}

	this.exists = function(){}
}

module.exports = function(mongoose){
	var store = new MongooseFiles(mongoose);
	mongoose.files = store;
	return store;
}