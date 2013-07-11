/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    i18n = require('../index'),
    express = require('express'),
    assert = require('chai').assert,
    dust = require('express-dustjs'),
    bundle = require('../lib/provider/bundle');

describe('API', function () {

    var templateRoot, app, config;


    before(function () {
        templateRoot = path.join(process.cwd(), 'test', 'fixtures', 'public', 'templates');

        app = express();
        app.engine('dust', dust.dust({ cache: false }));
        app.engine('js', dust.js({ cache: false }));
        app.set('view cache', false);
        app.set('view engine', 'dust');
        app.set('views', templateRoot);

        config = {
            fallback: 'en_US',
            contentPath: path.join(process.cwd(), 'test', 'fixtures', 'locales'),
            cache: false
        };
    });


    it('should create an API instance', function () {
        var api = i18n.create(config);
        assert.isObject(api);
        assert.isFunction(api.getBundle);
        assert.isFunction(api.configureExpress);
    });


    describe('getBundle', function () {

        var options;

        before(function () {
            options = {
                contentRoot: config.contentPath,
                fallbackLocale: 'en_US',
                cache: false
            };
        });


        it('should return an existing bundle', function (next) {
            var api = i18n.create(options);
            api.getBundle('test', 'en-US', function (err, testBundle) {
                assert.isNull(err);
                assert.isObject(testBundle);
                assert.ok(bundle.isContentBundle(testBundle));
                assert.strictEqual(testBundle.get('test.value'), 'Foo');
                next();
            });
        });


        it('should not return a nonexistent bundle', function (next) {
            var api = i18n.create(options);
            api.getBundle('unknown', 'en-US', function (err, testBundle) {
                assert.isObject(err);
                assert.isNotObject(testBundle);
                next();
            });
        });


        it('should not return a fallback bundle', function (next) {
            var api = i18n.create(options);
            api.getBundle('test', 'fr_CA', function (err, testBundle) {
                assert.isNull(err);
                assert.isObject(testBundle);
                assert.ok(bundle.isContentBundle(testBundle));
                assert.strictEqual(testBundle.get('test.value'), 'Foo');
                next();
            });
        });

    });


    describe('configureExpress', function () {

    });


});