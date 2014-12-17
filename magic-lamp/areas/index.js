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
        var moduleConfig = getModuleConfig(folderPath);
        if (moduleConfig) {
            require(moduleConfig).init(app, config);
            debug('loaded: ' + folderName);
        }
        //var configName = path.join(folderPath, 'index.js');
        
        //if (fs.existsSync(configName)) {
        //    var module = require(configName);
        //    module.init(app, config);
        //    debug('loaded: ' + folderName);
        //}
    });
}

function getModuleConfig(folderPath){
    
    var index = path.join(folderPath, 'index.js');
    if (fs.existsSync(index))
        return index;
    
    var name = path.basename(folderPath);
    var module = path.join(folderPath, name + '.module.js');
    if (fs.existsSync(module))
        return module;

    return null;
}


module.exports = {
    init: loadAreas
}