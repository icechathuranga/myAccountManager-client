/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true});
var util = require('util')
var colors = require('colors');
var sass = require('gulp-sass');
var debug = require('gulp-debug');
var concatCss = require('gulp-concat-css');
var args = require('yargs').argv;
var _ = require('lodash');
var $order = require("gulp-order");
var gulpIf = require('gulp-if');
var $inject = require('gulp-inject');
var rename = require("gulp-rename");
var wiredep = require('wiredep');
var bowerFiles = wiredep({devDependencies: true})['js'];

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var Log = require('log')
        , log = new Log('info');

var appDir = '../app/';
var bower = {
    json: require('./bower.json'),
    directory: './bower_components/',
    ignorePath: ''
};
var config = {
    files_scss: './styles/*.scss',
    location_css: '../css/',
    cssOutputStyle: {},
    js: [
        appDir + '**/*.module.js',
        appDir + '**/*.js'
    ],
    jsOrder: [
        '**/app.module.js',
        '**/*.module.js',
        '**/*.js'
    ],
    stubsjs: [
        bower.directory + 'angular-mocks/angular-mocks.js'
    ],
    file_index_template: './index-template.html',
    file_index: 'index.html',
    location_index_file: '../',
    getWiredepDefaultOptions: function () {
        var me = this;
        var options = {
            bowerJson: bower.json,
            directory: bower.directory,
            ignorePath: bower.ignorePath,
            fileTypes: {
                html: {
                    replace: {
                        js: '<script src="' + me.contentDirectory + '{{filePath}}"></script>',
                        css: '<link rel="stylesheet" href="' + me.contentDirectory + '{{filePath}}" />'
                    }
                }
            }
        };
        return options;
    },
    injectOptions: {
        read: false,
        relative: true
    },
    ignorePathSettings: {
        ignorePath: '../',
        addRootSlash: false
    },
    contentDirectory: 'content/'
}
/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function logger(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                log.info(msg[item].info);
            }
        }
    } else {
        log.info(colors.info(msg));
    }
}

gulp.task('default', ['dev'], function () {
    // place code for your default task here
});

gulp.task('prod', ['set-up-prod-env', 'dev'], function () {

});

gulp.task('set-up-prod-env', function () {
    config.cssOutputStyle = {outputStyle: 'compressed'}
});




gulp.task('dev', ['wiredep', 'styles'], function () {

});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredep', ['styles'], function () {
    logger('Wiring the bower dependencies into the html');

    var wiredep = require('wiredep').stream;
    var options = config.getWiredepDefaultOptions();


    var js = args.stubs ? [].concat(config.js, config.stubsjs) : config.js;

    var css = gulp
            .src(config.location_css + '*.css', {read: false});

    return gulp
            .src(config.file_index_template)
            .pipe(debug({title: 'index:'}))
            .pipe(wiredep(options))
            .pipe(debug({title: 'wiredep:'}))
            .pipe($inject(css, config.ignorePathSettings))
            .pipe(inject(js, '', config.jsOrder))
            .pipe(debug({title: 'JS:'}))
            .pipe(rename(config.file_index))
            .pipe(debug({title: 'index.html:'}))
            .pipe(gulp.dest(config.location_index_file));
});

/**
 * Compile sass files to css
 */
gulp.task('styles', ['clean-styles'], function () {
    logger('Compiling SCSS to css ...');

    return gulp
            .src(config.files_scss)
            .pipe($.plumber())
            .pipe(debug({title: 'scss:'}))
            .pipe(sass(config.cssOutputStyle).on('error', sass.logError))
            .pipe(debug({title: 'css:'}))
            .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
            .pipe(gulp.dest(config.location_css));
});


/**
 * Remove all styles from the css directory
 */
gulp.task('clean-styles', function () {
    logger('Starting cleaning ...');
    var files = [].concat(
            config.location_css + '/*.css'
            );
    clean(files);
});


/**
 * Delete all files in a given path
 */
function clean(path) {
    logger('Cleaning: ' + colors.info(path));
    del(path, {force: true});

}


/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = _.clone(config.injectOptions);

    if (label) {
        options.name = 'inject:' + label;
    }
    return $inject(orderSrc(src, order, options), config.ignorePathSettings);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc(src, order, options) {
    //order = order || ['**/*'];
    return gulp
            .src(src, options)
            .pipe(gulpIf(order, $order(order)));
}
