var gulp = require('gulp');
var plug = require('gulp-load-plugins')();
var wrap = require('gulp-wrap');
var wiredep = require('wiredep');
var es = require('event-stream');

var paths = {
    src: {
        js: 'app/**/*.js',        
        less: 'less/app.less',
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

//gulp.task('wiredep', function () {
//    //log('Wiring the bower dependencies into the html');

//    var wiredep = require('wiredep').stream;
//    var index = './index.html';
    
//    return gulp.src(index)
//        .pipe(wiredep({
//            directory: './bower_components/',
//            bowerJson: require('./bower.json'),
//            ignorePath: '../..' // bower files will be relative to the root
//        }))
//        .pipe(gulp.dest(paths.output.root));
//});

gulp.task('inject',['build-vendor', 'build-app'], function () {

    var vendorJs = paths.output.js + '/vendor.js';
    var vendorCss = paths.output.css + '/vendor.css';
    var appJs = paths.output.js + '/app.js';
    var appCss = paths.output.css + '/app.css';
    var index = paths.output.root + '/index.html'

    var options = { ignorePath: 'wwwroot', addRootSlash: false };

    return gulp.src(paths.src.index)
        //.pipe(gulp.dest(paths.output.root))
        
        .pipe(plug.inject(gulp.src([vendorCss, appCss], { read: false }), options))
        .pipe(plug.inject(gulp.src([vendorJs, appJs], { read: false }), options))
        
        .pipe(gulp.dest(paths.output.root));
});

gulp.task('compile:src:js', function () {
    return gulp.src(paths.src.js)
        .pipe(wrap('(function(){\n"use strict";\n<%= contents %>\n})();'))
        .pipe(plug.ngAnnotate())
        .pipe(plug.concat('app.js'))
        //.pipe(plug.uglify())
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('compile:src:less', function () {
    return gulp.src(paths.src.less)
        .pipe(plug.less())
        .pipe(gulp.dest(paths.output.css));
})

gulp.task('compile:vendor:js', function () {

    var vendor = wiredep().js;
    return gulp.src(vendor)
       .pipe(plug.concat('vendor.js'))
       .pipe(gulp.dest(paths.output.js))
});

gulp.task('compile:vendor:css', function () {
    var vendorFiles = require('wiredep')().css;
    return gulp.src(vendorFiles)
        .pipe(plug.concat('vendor.css'))
        .pipe(gulp.dest(paths.output.css));
});

gulp.task('build-vendor', ['compile:vendor:js', 'compile:vendor:css']);
gulp.task('build-app', ['compile:src:js', 'compile:src:less']);

gulp.task('default', ['inject', 'build-app', 'build-vendor']);