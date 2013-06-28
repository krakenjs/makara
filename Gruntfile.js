'use strict';

module.exports = function (grunt) {


    grunt.initConfig({
        'dustjs-i18n': {
            files: ['test/fixtures/public/templates/**/test.dust', 'test/fixtures/public/templates/inc/*.dust'],
            options: {
                contentPath: ['test/fixtures/locales/**/*.properties']
            }
        }
    });


    grunt.loadTasks('./tasks/');
    grunt.registerTask('test', ['dustjs-i18n']);

};