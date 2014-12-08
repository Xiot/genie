var gulp = require('gulp');
var concat = require('gulp-concat');
var del = require('del');
var es = require('event-stream');

var less = require('gulp-less');
var livereload = require('gulp-livereload');
var ngAnnotate = require('gulp-ng-annotate');
var watch = require('gulp-watch');

var vendorFiles = [
    'bower_components/socket.io-client/socket.io.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/angular-socket-io/socket.js',
    'bower_components/bootstrap/dist/css/bootstrap.css'
]

gulp.task('clean-vendor', function () {
    del('wwwroot/vendor/*.*');
});

gulp.task('clean-src', function () {
    del('wwwroot/scripts/*.*');
});

gulp.task('copy', ['clean-vendor', 'copy-bootstrap'], function () {
    return gulp.src(vendorFiles)
        .pipe(gulp.dest('wwwroot/vendor'));
});

gulp.task('copy-bootstrap', function () {
    var fonts = gulp.src('bower_components/bootstrap/dist/fonts/*.*')
        .pipe(gulp.dest('wwwroot/fonts'));

    var css = gulp.src('bower_components/bootstrap/dist/css/bootstrap.css')
        .pipe(gulp.dest('wwwroot/styles'));

    return es.merge(fonts, css);
})

gulp.task('compile:src', ['clean-src'], function () {
    return gulp.src('app/**/*.js')
           .pipe(concat('app.js'))
        .pipe(gulp.dest('wwwroot/scripts'));
});
gulp.task('compile:less', function () {
    return gulp.src('app/less/app.less')
        .pipe(less())
        .pipe(gulp.dest('wwwroot/styles'))
})

gulp.task('watch', ['default'], function () {

    livereload.listen();

    gulp.watch('app/**/*.js', ['compile:src']);
    gulp.watch('app/less/*.less', ['compile:less']);
    //gulp.watch('app/partials/**/*.html', ['compile:partials']);

    gulp.watch('wwwroot/**').on('change', livereload.changed);
});

gulp.task('default', ['copy', 'compile:src', 'compile:less']);
