﻿var gulp = require('gulp');
var plug = require('gulp-load-plugins')();
var wiredep = require('wiredep');
var es = require('event-stream');

var indexFallback = require('connect-history-api-fallback');
var run = require('run-sequence');

var env = plug.util.env;

var paths = {
    src: {
        js: 'app/**/*.js',
        less: 'app/less/**/*.less',
        lessRoot: 'app/less/app.less',
        index: 'index.html',
        templates: 'app/**/*.html',
        images: 'resources/images/*.*'
    },
    output: {
        root: 'wwwroot',
        js: 'wwwroot/scripts',
        css: 'wwwroot/styles',
        fonts: 'wwwroot/fonts',
        images: 'wwwroot/img'
    }
}

gulp.task('compile:src:img', function(){
    return gulp.src(paths.src.images)
        //.pipe(plug.imagemin())
        .pipe(gulp.dest(paths.output.images));
})

gulp.task('compile:src:html', function () {
    return gulp.src(paths.src.templates)
        .pipe(plug.size({ title: 'before' }))
        .pipe(plug.htmlmin({ removeComments: true, collapseWhitespace: true }))
        .pipe(plug.angularTemplatecache('app.partials.js', {
            module: 'solomon.partials',
            standalone: true,
            root: 'app/'
        }))

        //.pipe(plug.uglify())
        .pipe(plug.size({ title: 'after' }))
    .pipe(plug.size({ title: 'gzip', gzip: true }))
        .pipe(gulp.dest(paths.output.js));
})

gulp.task('wiredep', function () {
    //log('Wiring the bower dependencies into the html');

    var wiredep = require('wiredep').stream;
    var index = './index.html';

    return gulp.src(index)
        .pipe(wiredep({
            directory: './bower_components/',
            bowerJson: require('./bower.json'),
            ignorePath: '../..', // bower files will be relative to the root,
            overrides: {
                'socket.io-client': {
                    'main': 'socket.io.js'
                }
            }
        }))
        .pipe(gulp.dest(paths.output.root));
});

gulp.task('inject',['build-vendor', 'build-app'], function () {

    var vendorJs = paths.output.js + '/vendor.js';
    var vendorCss = paths.output.css + '/vendor.css';
    var appJs = paths.output.js + '/app.js';
    var appHtml = paths.output.js + '/app.partials.js';
    var appCss = paths.output.css + '/app.css';
    var index = paths.output.root + '/index.html'

    var options = { ignorePath: 'wwwroot', addRootSlash: false };

    return gulp.src(paths.src.index)
        //.pipe(gulp.dest(paths.output.root))

        .pipe(plug.inject(gulp.src([
            vendorJs, vendorCss
            , appJs, appCss, appHtml
        ], { read: false }), options))
        //.pipe(plug.inject(gulp.src([appJs, appCss], { read: false }), options))

        .pipe(gulp.dest(paths.output.root));
});

gulp.task('compile:src:js', function () {
    return gulp.src(paths.src.js)
        .pipe(plug.jshint())
        .pipe(plug.jshint.reporter('default'))
        .pipe(plug.sourcemaps.init())

        .pipe(plug.wrapJs('(function() {\r\n"use strict";\r\n%= body %\r\n})();', { newline: '\r\n' }))
        .on('error', function(){})

        .pipe(plug.ngAnnotate())

        .pipe(plug.angularFilesort())
        .pipe(plug.concat('app.js'))
        //.pipe(plug.uglify())
        .pipe(plug.sourcemaps.write())
        .pipe(gulp.dest(paths.output.js));
});

gulp.task('compile:src:less', function () {
    return gulp.src(paths.src.lessRoot)
        .pipe(plug.less())
        .on('error', function(err){
            console.log(err);
        })
        .pipe(gulp.dest(paths.output.css));
})

gulp.task('compile:vendor:js', function () {

    var vendor = wiredep({
        exclude: ['bootstrap.js', 'jquery.js', 'angular-charts.js'],
        overrides: {
            'socket.io-client': {
                'main': 'socket.io.js'
            },
            'flot': {
                'main': [
                    'jquery.flot.js',
                    'jquery.flot.time.js',
                    'jquery.flot.resize.js',
                    'jquery.flot.navigate.js',
                    'jquery.flot.pie.js'
                    ]
            }
        }
    }).js;

    return es.merge(
        gulp.src(vendor)
            .pipe(plug.using())
            .pipe(plug.concat('vendor.js'))
            //.pipe(plug.uglify())
            .pipe(plug.size({title:'vendor gzip', gzip: true}))
            .pipe(gulp.dest(paths.output.js)),
       gulp.src('bower_components/jquery/dist/jquery.js')
        .pipe(gulp.dest(paths.output.js))
   );
});

gulp.task('compile:vendor:css', function () {
    var vendorFiles = require('wiredep')().css;
    return gulp.src(vendorFiles)
        .pipe(plug.concat('vendor.css'))
        .pipe(gulp.dest(paths.output.css));
});

gulp.task('fonts', function(){

    var fontTypes = ['.eot', '.svg', '.ttf', '.woff', '.woff2'];
    var fonts = [];

    fontTypes.forEach(function (ext) {
        fonts.push("resources/fonts/**/*" + ext);
        fonts.push('bower_components/bootstrap/dist/fonts/*' + ext);
        fonts.push('bower_components/font-awesome/fonts/*' + ext);
    });

    return gulp.src(fonts)
        .pipe(gulp.dest(paths.output.fonts));

})

gulp.task('build-vendor', ['fonts', 'compile:vendor:js', 'compile:vendor:css']);
gulp.task('build-app', ['compile:src:js', 'compile:src:less', 'compile:src:html']);

gulp.task('default', ['inject', 'build-app', 'build-vendor']);

/*
gulp.task('server', function (next) {
    var connect = require('connect'),
        server = connect();
    server.use(connect.static(dest)).listen(process.env.PORT || 80, next);
});

gulp.task('watch', ['server'], function () {
    var server = livereload();
    gulp.watch(dest + '/**').on('change', function (file) {
        server.changed(file.path);
    });
});
*/
var port = process.env.PORT || 3002;

gulp.task('serve',  function (next) {

    //var server = plug.connect();
    //server.use(plug.connect.static('wwwroot'))
    //    .listen(port, next);

    plug.connect.server({
        //livereload: reloadPort,
        port: port,
        root: ['wwwroot'],
        middleware: function(connect, opt){
            return [indexFallback];
        }
    });
});

//gulp.task('livereload', function () {
//    return gulp.src(['wwwroot/**/*.*'])
//        .pipe(plug.watch())
//        .pipe(plug.connect.reload());
//});

gulp.task('watch', function () {

    if (env.sync)
        plug.livereload.listen();

    gulp.watch(paths.src.js, ['compile:src:js']);
    gulp.watch(paths.src.less, ['compile:src:less']);
    gulp.watch(paths.src.templates, ['compile:src:html']);
    gulp.watch(paths.src.index, ['inject']);
    //gulp.watch('wwwroot/**').on('change', function (e) {
    //    console.log('File ' + e.path + ' was ' + e.type);
    //    plug.connect.reload(e);
    //});
    gulp.watch(paths.output.root + '/**').on('change', plug.livereload.changed);
});

gulp.task('dev', function (cb) {
    run('default', 'compile:src:img', 'watch', 'serve', cb);
});
