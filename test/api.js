/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    i18n = require('../index'),
    express = require('express'),
    assert = require('chai').assert,
    dust = require('express-dustjs'),
    bundle = require('../lib/provider/bundle');

describe('API', function () {


    describe('create', function () {
        var config;

        function createServer() {
            var app = express();
            app.engine('dust', dust.dust({ cache: false }));
            app.engine('js', dust.js({ cache: false }));
            app.set('view cache', false);
            app.set('view engine', 'dust');
            app.set('views', path.join(process.cwd(), 'test', 'fixtures', 'public', 'other'));
            return app;
        }


        before(function () {
            // Undo side-effects
            dust.onLoad = undefined;

            config = {
                fallback: 'en_US',
                contentPath: path.join(process.cwd(), 'test', 'fixtures', 'locales'),
                templatePath: path.join(process.cwd(), 'test', 'fixtures', 'public', 'templates'),
                cache: false,
                enableHtmlMetadata: false
            };
        });


        afterEach(function () {
            // Undo side-effects
            dust.onLoad = undefined;
        });


        it('should create an instance', function () {
            var api = i18n.create(config);

            assert.isObject(api);
            assert.isFunction(api.getBundle);
            assert.isFunction(api.localize);
            assert.strictEqual(api.cache, config.cache);

            assert.isObject(api.contentProvider);
            assert.strictEqual(api.contentProvider.cache, config.cache);
            assert.strictEqual(api.contentProvider.htmlMetadataEnabled, config.enableHtmlMetadata);

            assert.isObject(api.templateTranslator);
            assert.strictEqual(api.templateTranslator.templateRoot, config.templatePath);
            assert.strictEqual(api.templateTranslator.contentProvider, api.contentProvider);
        });


        it('should configure an optional express application', function () {
            var app, api;

            // Precondition
            assert.isUndefined(dust.onLoad);

            app = createServer();
            api = i18n.create(app, config);

            assert.isObject(api);
            assert.isFunction(api.getBundle);
            assert.isFunction(api.localize);
            assert.strictEqual(api.cache, config.cache);

            assert.isObject(api.contentProvider);
            assert.strictEqual(api.contentProvider.cache, config.cache);
            assert.strictEqual(api.contentProvider.htmlMetadataEnabled, config.enableHtmlMetadata);

            assert.isObject(api.templateTranslator);
            assert.strictEqual(api.templateTranslator.templateRoot, app.get('views')); // express 'views' overrides templatePath and templateRoot
            assert.strictEqual(api.templateTranslator.contentProvider, api.contentProvider);

            assert.isFunction(dust.onLoad);
            assert.strictEqual(dust.onLoad.name, 'onLoad'); // caching is disabled so onLoad should not be decorated
        });


        it('should configure an optional express application with caching', function () {
            var app, api;

            config.cache = true;

            // Precondition
            assert.isUndefined(dust.onLoad);

            app = createServer();
            api = i18n.create(app, config);

            assert.isObject(api);
            assert.isFunction(api.getBundle);
            assert.isFunction(api.localize);
            assert.strictEqual(api.cache, config.cache);

            assert.isObject(api.contentProvider);
            assert.strictEqual(api.contentProvider.cache, config.cache);
            assert.strictEqual(api.contentProvider.htmlMetadataEnabled, config.enableHtmlMetadata);

            assert.isObject(api.templateTranslator);
            assert.strictEqual(api.templateTranslator.templateRoot, app.get('views')); // express 'views' overrides templatePath and templateRoot
            assert.strictEqual(api.templateTranslator.contentProvider, api.contentProvider);

            assert.isFunction(dust.onLoad);
            assert.notEqual(dust.onLoad.name, 'onLoad'); // caching is enable so onLoad should be decorated now
        });

    });


    describe('getBundle', function () {

        var options, api;

        before(function () {
            options = {
                contentRoot: path.join(process.cwd(), 'test', 'fixtures', 'locales'),
                fallbackLocale: 'en_US',
                cache: false
            };

            api = i18n.create(options);
        });


        it('should return a loaded bundle', function (next) {
            api.getBundle('test', 'zh-CN', function (err, testBundle) {
                assert.isNull(err);
                assert.isObject(testBundle);
                assert.ok(bundle.isContentBundle(testBundle));
                assert.strictEqual(testBundle.get('test.value'), '請');
                next();
            });
        });


        it('should reload bundle when caching is disabled', function (next) {
            api.getBundle('test', 'zh-CN', function (err, orig) {
                assert.isNull(err);
                assert.ok(bundle.isContentBundle(orig));

                api.getBundle('test', 'zh-CN', function (err, clone) {
                    assert.isNull(err);
                    assert.ok(bundle.isContentBundle(clone));
                    assert.notEqual(orig, clone);
                    assert.strictEqual(orig.get('test.value'), clone.get('test.value'));
                    next();
                });
            });
        });


        it('should reuse bundle when caching is enabled', function (next) {
            options.cache = true;

            api = i18n.create(options);

            api.getBundle('test', 'zh-CN', function (err, orig) {
                assert.isNull(err);
                assert.ok(bundle.isContentBundle(orig));

                api.getBundle('test', 'zh-CN', function (err, clone) {
                    assert.isNull(err);
                    assert.ok(bundle.isContentBundle(clone));
                    assert.strictEqual(orig, clone);
                    assert.strictEqual(orig.get('test.value'), clone.get('test.value'));
                    next();
                });
            });
        });

    });


    describe.skip('localize', function () {

    });

    describe.skip('createTranslator', function () {

    });

    describe.skip('createProvider', function () {

    });


});