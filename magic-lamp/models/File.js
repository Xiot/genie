var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	filename: String,
	contentType: String,
	length: Number,
	chunkSize: Number,
	uploadDate: Date,
	aliases: String,
	metadata: mongoose.Schema.Types.Mixed,
	md5: String
}, {collection: 'fs.files'});

schema.methods = {
	openRead: function(){
		return mongoose.files.get(this._id);
	},
	send: function(res){
		res.writeHead(200, {
			'Content-Type': this.contentType
		});
		this.openRead().pipe(res);
	}
}

module.exports = mongoose.model('File', schema);
