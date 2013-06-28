'use strict';

module.exports = function (grunt) {


    grunt.initConfig({
        jshint: {
            files: ['Gruntfile.js', 'lib/**/*.js', 'test/fixtures/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        simplemocha: {
            options: {
                globals: ['chai'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'tap'
            },
            all: { src: 'test/*.js' }
        },
        'dustjs-i18n': {
            files: ['test/fixtures/public/templates/**/test.dust', 'test/fixtures/public/templates/inc/*.dust'],
            options: {
                contentPath: ['test/fixtures/locales/**/*.properties']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadTasks('./tasks/');

    grunt.registerTask('test', ['jshint', 'simplemocha', 'dustjs-i18n']);

};