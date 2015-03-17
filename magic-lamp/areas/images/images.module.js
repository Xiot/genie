var mongoose = require('mongoose');
var debug = require('debug')('magic-lamp-images');
var File = mongoose.model('File');

module.exports = {
    init: function(server, config) {

        var route = server.route('/images');
        // route.param('image_id', function(req, res, next, value){
        // 	mongoose.files.get(value)
        // })
        route.get('/:image_id', 'get-image', async function(req, res) {

            var imageId = req.params.image_id;

            var image = await File.findByIdAsync(imageId)


            image.send(res);
			//next();
            //return null;

        });
    }
}
