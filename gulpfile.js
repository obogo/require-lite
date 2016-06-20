var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var ts = require('gulp-typescript');
var Server = require('karma').Server;

// options
var tsFiles = 'require-lite.ts';
var sourceFiles = 'require-lite.js';
var destinationFolder = 'dist';

// tasks
gulp.task('compile', function() {
    return gulp.src(tsFiles, {cwd: "src"})
        .pipe(ts({
            noImplicitAny: false,
            module: "amd"
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('minify', function () {
    return gulp.src(sourceFiles, {cwd: "src"})
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(concat(sourceFiles))
        .pipe(gulp.dest(destinationFolder)) // save .js
        .pipe(uglify({ preserveComments: 'license' }))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(destinationFolder)); // save .min.js
});

gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('default', ['compile', 'minify']);