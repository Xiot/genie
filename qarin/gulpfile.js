var gulp = require('gulp');
var del = require('del');
var es = require('event-stream');
var path = require('path');
var run = require('run-sequence');

var list = require('./gulp/file-lister');
var plug = require('gulp-load-plugins')();
var wiredep = require('wiredep');

var env = plug.util.env;

var port = process.env.PORT || 3001;
var minify = !!env.prod;

console.log(env);

var paths = {
    src: {
        js: 'app/**/*.js',
        less: 'app/less/**/*.less',
        lessRoot: 'app/less/app.less',
        index: 'index.html',
        templates: 'app/**/*.html'
    },
    output: {
        root: 'wwwroot',
        js: 'wwwroot/scripts',
        css: 'wwwroot/styles',
        fonts: 'wwwroot/fonts'
    }
}

gulp.task('clean', function (cb) {
    del(['wwwroot/**/*.*','!bin/**/*.*'],cb);
})

gulp.task('compile:vendor:js', function () {
    var vendor = wiredep({
        exclude: ['bootstrap.js', 'jquery.js'],
        overrides: {
            'socket.io-client': {
                main: 'socket.io.js'
            }
        }
    }).js;

    return gulp.src(vendor)
        //.pipe(list('vendor files'))
        .pipe(plug.concat('vendor.js'))
        .pipe(plug.if(minify, plug.uglify()))
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('compile:vendor:css', function () {
    var vendor = wiredep().css;
    return gulp.src(vendor)
        .pipe(plug.concat('vendor.css'))
        .pipe(gulp.dest(paths.output.css));
})

gulp.task('fonts', function () {
    return gulp.src('bower_components/bootstrap/dist/fonts/*.*')
        .pipe(gulp.dest('wwwroot/fonts'));
});

gulp.task('compile:vendor', ['compile:vendor:js', 'compile:vendor:css', 'fonts']);

gulp.task('compile:app:js', function () {
    return gulp.src(paths.src.js)
        .pipe(plug.jshint())
        .pipe(plug.jshint.reporter('default'))

        .pipe(plug.sourcemaps.init())

        .pipe(plug.wrapJs('(function() {\r\n"use strict";\r\n%= body %\r\n})();', { newline: '\r\n' }))
        .on('error', function(){})
        
        .pipe(plug.ngAnnotate())

        .pipe(plug.angularFilesort())
        .pipe(plug.concat('app.js'))
        .pipe(plug.if(minify, plug.uglify()))
        .pipe(plug.sourcemaps.write())
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('compile:app:less', function () {
    return gulp.src(paths.src.lessRoot)
        .pipe(plug.less())
        .pipe(gulp.dest(paths.output.css));
});

gulp.task('compile:app:html', function () {
    return gulp.src(paths.src.templates)
        .pipe(plug.size({ title: 'before' }))
        .pipe(plug.htmlmin({ removeComments: true, collapseWhitespace: true }))
        .pipe(plug.angularTemplatecache('app.partials.js', {
            module: 'qarin.partials',
            standalone: true,
            root: 'app/'
        }))

        .pipe(plug.if(minify, plug.uglify()))
        .pipe(plug.size({ title: 'after' }))
        .pipe(plug.size({ title: 'gzip', gzip: true }))
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('compile:app', ['compile:app:js', 'compile:app:less', 'compile:app:html']);

gulp.task('compile:app:index', ['compile:app', 'compile:vendor'], function () {

    var options = { ignorePath: 'wwwroot', addRootSlash: false };

    var files = output(
        'vendor.js', 'vendor.css',
        'app.js', 'app.partials.js', 'app.css' );

    return gulp.src(paths.src.index)
        .pipe(plug.inject(
            gulp.src(files, { read: false })            
            , options))
        .pipe(gulp.dest(paths.output.root));

});

gulp.task('default', function (cb) {    
    run('clean', 'compile:app:index', cb);
});

gulp.task('watch', function () {   

    gulp.watch(paths.src.js, ['compile:app:js']);
    gulp.watch(paths.src.less, ['compile:app:less']);
    gulp.watch(paths.src.templates, ['compile:app:html']);
    gulp.watch(paths.src.index, ['compile:app:index']);
    
    if (env.sync) {
        plug.livereload.listen();
        gulp.watch('wwwroot/**').on('change', plug.livereload.changed);
    }    
});

gulp.task('serve', function () {
    plug.connect.server({
        port: port,
        //livereload: true,
        root: ['wwwroot']
    });
});

gulp.task('dev', function (cb) {
    run('default', 'watch', 'serve', cb);
})

function output(){

    var filepaths = [];
    for (var i = 0; i < arguments.length; i++) {
        var localFile = arguments[i];
        var outputPath = getOutputPath(localFile);
        filepaths.push(outputPath);
    }

    if (filepaths.length === 1)
        return filepaths[0];

    return filepaths;

}

function getOutputPath(localPath) {
    var ext = path.extname(localPath);
    if (!ext)
        return localPath;

    ext = ext.substring(1);

    var outputFolder = paths.output[ext];
    if (!outputFolder)
        return localPath;

    var outputPath = path.join(outputFolder, localPath);
    return outputPath;
}