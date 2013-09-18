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
                reporter: 'spec'
            },
            all: { src: 'test/*.js' }
        },
        'dustjs-i18n': {
            files: ['test/fixtures/public/templates/**/test.dust', 'test/fixtures/public/templates/inc/*.dust'],
            options: {
                contentPath: ['test/fixtures/locales/**/*.properties']
            }
        },
        dustjs: {
            compile: {
                files: [
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: '**/*.dust',
                        dest: '.build/templates',
                        ext: '.js'
                    }
                ]
            }
        },
        clean: {
            'tmp': 'tmp',
            'build': '.build'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-dustjs');
    grunt.loadTasks('./tasks/');

    grunt.registerTask('i18n', ['clean', 'dustjs-i18n', 'dustjs', 'clean']);
    grunt.registerTask('test', ['jshint', 'simplemocha', 'i18n']);

};