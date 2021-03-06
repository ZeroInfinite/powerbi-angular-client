var gulp = require('gulp-help')(require('gulp')),
    $ = require('gulp-load-plugins')({ lazy: true }),
    config = require('./gulp/config')(),
    del = require('del'),
    merge2 = require('merge2'),
    moment = require('moment'),
    runSequence = require('run-sequence'),
    webpack = require('webpack-stream'),
    webpackConfig = require('./webpack.config')
    ;

gulp.task('build', function (done) {
    runSequence(
        'clean:dist',
        'compile:src',
        ['copycss', 'vendor'],
        ['templates', 'replace'],
        done
    );
});

gulp.task('ghpages', 'Deploy application to gh-pages branch', function () {
  return gulp.src(['./dist/**/*'])
    .pipe($.ghPages({
        force: true,
        message: 'Update ' + moment().format('LLL')
    }));
});

gulp.task('compile:watch', 'Watch sources', function () {
    gulp.watch(['./app/**/*.ts', './app/**/*.html'], ['compile:src', 'templates', 'replace']);
});

gulp.task('clean:dist', function() {
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['dist']);
});

gulp.task('compile:src', 'Compile typescript for library', function() {
    return gulp.src(['./app/**/*.ts'])
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error);
                this.emit('end');
            }
        }))
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./dist'));
});

gulp.task('templates', function () {
    return gulp.src(config.templates)
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error);
                this.emit('end');
            }
        }))
        .pipe($.minifyHtml({
            empty: true
        }))
        .pipe($.angularTemplatecache('app.templates.js', {
            module: 'app',
            root: '/app'
        }))
        .pipe(gulp.dest(config.distFolder))
        ;
});

gulp.task('copycss', function () {
    return gulp.src([
        './node_modules/bootstrap/dist/css/bootstrap.css',
        './app/styles/app.css'
    ])
        .pipe(gulp.dest(config.distFolder))
        ;
});

gulp.task('vendor', function () {
    return gulp.src([
        './node_modules/angular/angular.js',
        './node_modules/angular-ui-router/release/angular-ui-router.js',
        './node_modules/powerbi-client/dist/powerbi.js',
        './node_modules/angular-powerbi/dist/angular-powerbi.js'
    ])
        .pipe($.concat('vendor.js'))
        .pipe(gulp.dest(config.distFolder))
    ;
});

gulp.task('replace', function () {
    return gulp.src(config.htmlPage)
        .pipe($.htmlReplace({
            'css': ['bootstrap.css', 'app.css'],
            'js': ['vendor.js', 'app.js', 'app.templates.js']
        }))
        .pipe(gulp.dest(config.distFolder))
        ;
});