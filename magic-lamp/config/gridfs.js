var grid = require('gridfs-stream');
var Promise = require('bluebird');
var debug = require('debug')('magic-lamp-gridfs');

function MongooseFiles(mongoose) {

	var gfs = grid(mongoose.connection.db, mongoose.mongo);

	this.getInfo = function(id){

		if(typeof id === 'string')
			id = new mongoose.Types.ObjectId(id);

		return new Promise(function(resolve, reject) {
			return gfs.files.find({
				_id: id
			}).toArray(function(err, files) {
				if (err) {
					reject(err);
				} else {
					resolve(files);
				}
			});
		})
	}

	this.get = function(id) {
		return gfs.createReadStream({_id: id});
	}

	this.put = function(data, fileStream) {

		//if(!data.id)
		//	data.id = new ObjectID();

		debug('put', data);

		return new Promise(function(resolve, reject) {

			try {
				var stream = gfs.createWriteStream(data);
				stream.on('close', function(file) {
					debug('stream-close', file);
					resolve(file);
				});
				stream.on('error', function(ex) {
					debug('stream error', ex);
					reject(ex);
				});

				fileStream.pipe(stream);
			} catch (ex) {
				debug('general error', ex);
				reject(ex);
			}
			//return stream;
		});
	}

	this.gfs = gfs;

	this.exists = function() {}
}

module.exports = function(mongoose) {
	var store = new MongooseFiles(mongoose);
	mongoose.files = store;
	return store;
}