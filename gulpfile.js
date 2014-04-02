'use strict';

var gulp = require('gulp'),
    path = require('path'),
    dustjs = require('gulp-dust'),
    clean = require('gulp-clean'),
    makaraGulp = require('./tasks/dustjs-i18n-gulp')(gulp),

    paths = {
        tmp: 'tmp/',
        templateDest: '.build/templates'
    },
    globs = {
        files: [
            'test/fixtures/public/templates/**/*.dust',
            '!test/fixtures/public/templates/badsyntax.dust',
            '!test/fixtures/public/templates/missingbundle.dust'
        ],
        contentPath: 'test/fixtures/locales/**/*.properties',
        compileSrc: '**/*.dust',
        clean: ['tmp', '.build']
    };

var makaraOptions = {
    src: globs.files,
    contentPath: globs.contentPath,
    tmpDir: paths.tmp
};
// The user has a choice of either registering the existing task, like so:
// makaraGulp.register(makaraOptions);

// Or creating their own:
gulp.task('makara', ['clean'], function(){
    return makaraGulp.makaraTask(makaraOptions);
});

gulp.task('dustjs', ['makara'], function(){
    return gulp.src(path.join(paths.tmp, globs.compileSrc))
        .pipe(dustjs(function(file){
            return path.basename(file.relative, '.dust');
        }))
        .pipe(gulp.dest(paths.templateDest));
});

gulp.task('clean', function(){
    return gulp.src(globs.clean, {read:false})
        .pipe(clean());
});

gulp.task('i18n', ['dustjs']);


