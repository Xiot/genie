var mongoose = require('mongoose');
var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = save;


function save(req, opts) {

	if(!req.files)
		return Promise.resolve([]);

	opts = opts || {};

	var imagesToSave = [];
	_.forEach(req.files, function(img, key){

		var imageMetadata = _.extend({}, opts.metadata);
		if(typeof key === 'string')
			imageMetadata.upload_name = key;

		var fileOpts = {
			filename: img.name,
			content_type: img.type || 'binary/octet-stream',
			mode: 'w',
			metadata: imageMetadata
		};

		var task = mongoose.files.put(fileOpts, fs.createReadStream(img.path));
		imagesToSave.push(task);
	});

	return Promise.all(imagesToSave);

}