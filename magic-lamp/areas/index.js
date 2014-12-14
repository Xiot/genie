var fs = require('fs');
var path = require('path');

var debug = require('debug')('magic-lamp-modules');

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

function loadAreas(app, config){
    
    var folders = getDirectories(__dirname);
    folders.forEach(function (folderName) {
        
        var folderPath = path.join(__dirname, folderName);
        var configName = path.join(folderPath, 'index.js');
        
        if (fs.existsSync(configName)) {
            var module = require(configName);
            module.init(app, config);
            debug('loaded: ' + folderName);
        }
    });
}


module.exports = {
    init: loadAreas
}