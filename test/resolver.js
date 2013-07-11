/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('chai').assert,
    resolver = require('../lib/resolver');

describe('resolver', function () {

    var res;


    describe('with no fallback', function () {

        var config;

        before(function () {
            config = {
                root: path.join(process.cwd(), 'test', 'fixtures', 'public', 'templates'),
                ext: 'dust'
            };
        });

        it('should require a root directory', function () {
            var error;
            try {
                res = resolver.create();
            } catch (err) {
                error = err;
            } finally {
                assert.isObject(error);
            }
        });


        it('should require a file extension', function () {
            var error;
            try {
                res = resolver.create({ root: '' });
            } catch (err) {
                error = err;
            } finally {
                assert.isObject(error);
            }
        });


        it('should resolve an existing filename', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('test');
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should not resolve a nonexistent file', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('foobar');
            assert(!file.file);
        });


        it('should resolve a nested file', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('inc/partial');
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should not fall back when resolving nested templates', function () {
            // In this case the template name includes a directory. We're not breaking that
            // apart to look up a file.
            var file;
            res = resolver.create(config);
            file = res.resolve('inc/test');
            assert(!file.file);
        });

    });


    describe('with fallback', function () {

        var config;

        before(function () {
            config = {
                root: path.join(process.cwd(), 'test', 'fixtures', 'locales'),
                ext: 'properties',
                fallback: 'en-US'
            };
        });


        it('should resolve an existing filename', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('test');
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should not resolve a nonexistent file', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('foobar');
            assert(!file.file);
        });


        it('should fallback to the parent directory', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('country');
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should fallback to the grandparent directory', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('default');
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });

    });


    describe('with fallback and context', function () {

        var config;
        var context;

        before(function () {
            config = {
                root: path.join(process.cwd(), 'test', 'fixtures', 'locales'),
                ext: 'properties',
                fallback: 'en-US'
            };

            context = {
                locality: {
                    country: 'CN',
                    language: 'zh'
                }
            }
        });


        it('should resolve an existing filename', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('test', context.locality);
            assert(file.file, 'A known file was not found');
            assert(file.file.indexOf('CN/zh/test') !== -1, 'Resolver located the wrong file.');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should not resolve a nonexistent file', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('foobar', context.locality);
            assert(!file.file);
        });


        it('should fallback to the parent directory', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('country', context.locality);
            assert(file.file, 'A known file was not found');
            assert(file.file.indexOf('CN/country') !== -1, 'Resolver located the wrong file.');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should fallback to the grandparent directory', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('default', context.locality);
            assert(file.file, 'A known file was not found');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should fall back to use the configured fallback', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('en-only', context.locality);
            assert(file.file, 'A known file was not found');
            assert(file.file.indexOf('US/en/en-only') !== -1, 'Resolver located the wrong file.');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });


        it('should fall back to use the configured fallback, and fallback all over again', function () {
            var file;
            res = resolver.create(config);
            file = res.resolve('us-only', context.locality);
            assert(file.file, 'A known file was not found');
            assert(file.file.indexOf('US/us-only') !== -1, 'Resolver located the wrong file.');
            assert(fs.existsSync(file.file), 'The resolved file does not exist on disk.');
        });

    });

});