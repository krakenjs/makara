/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    provider = require('../lib/provider'),
    bundleFactory = require('../lib/provider/bundle');


describe('bundle', function () {

    var contentRoot, fallbackLocale;

    contentRoot = path.join(process.cwd(), 'test', 'fixtures', 'locales');
    fallbackLocale = 'en_US';

    describe('load', function () {

        var content;

        before(function () {
            content = provider.create(contentRoot, fallbackLocale);
        });


        it('should load the bundle', function (next) {
            var bundle = content.getBundle('test', 'en_US');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.value'), 'Foo');
                next();
            });
        });


        it('should return an error for an unknown bundle', function (next) {
            var bundle = content.getBundle('unknown', 'en_US');
            bundle.load(function (err, bundle) {
                assert.isObject(err);
                assert.equal(err.message, 'Content bundle not found: unknown');
                assert.isNotObject(bundle);
                next();
            });
        });


        it('should load a fallback bundle for an unknown locale', function (next) {
            var bundle = content.getBundle('test', 'fr_CA');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.value'), 'Foo');
                next();
            });
        });

    });


    describe('get', function () {

        var content;

        before(function () {
            content = provider.create(contentRoot, fallbackLocale);
        });


        it('should throw an error if not loaded', function () {
            var bundle, error;

            bundle = content.getBundle('test', 'en_US');

            try {
                bundle.get('test.value');
            } catch (err) {
                error = err;
            } finally {
                assert.isObject(error);
            }
        });


        it('should return a value for a known key', function (next) {
            var bundle = content.getBundle('test', 'en_US');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.value'), 'Foo');
                next();
            });
        });


        it('should return a default value for an unknown key', function (next) {
            var bundle = content.getBundle('test', 'en_US');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.unknown'), '☃test.unknown☃');
                next();
            });
        });


        it('should return a fallback value for an unknown locale', function (next) {
            var bundle = content.getBundle('test', 'fr_CA');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.value'), 'Foo');
                next();
            });
        });


        it('should return a default value for an unknown key and unknown locale', function (next) {
            var bundle = content.getBundle('test', 'fr_CA');
            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.ok(bundleFactory.isContentBundle(bundle));
                assert.strictEqual(bundle.get('test.unknown'), '☃test.unknown☃');
                next();
            });
        });


    });



});
