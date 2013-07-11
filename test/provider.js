/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    provider = require('../lib/provider');


describe('provider', function () {

    var contentRoot, fallbackLocale;

    before(function () {
        contentRoot = path.join(process.cwd(), 'test', 'fixtures', 'locales');
        fallbackLocale = 'en_US';
    });


    it('should create an instance', function () {
        var content = provider.create(contentRoot, fallbackLocale);
        assert.isObject(content);

        content = provider.create(contentRoot, { country: 'US', language: 'en' });
        assert.isObject(content);
    });


    it('should return a bundle for a given name/locale string', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, fallbackLocale);
        bundle = content.getBundle('test', 'en_US');
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isNull(err);
            assert.isObject(bundle);
            assert.strictEqual(bundle.get('test.value'), 'Foo');
            next();
        });
    });


    it('should return a bundle for a given name/locale object', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, fallbackLocale);
        bundle = content.getBundle('test', { country: 'CN', language: 'zh' });
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isNull(err);
            assert.isObject(bundle);
            assert.strictEqual(bundle.get('test.value'), '請');
            next();
        });
    });


    it('should return an error for an invalid bundle', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, fallbackLocale);
        bundle = content.getBundle('unknown', 'en_US');
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isObject(err);
            assert.isNotObject(bundle);
            next();
        });
    });


    it('should return a fallback bundle for a missing locale', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, 'zh_CN');
        bundle = content.getBundle('test', 'fr_CA');
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isNull(err);
            assert.isObject(bundle);
            assert.strictEqual(bundle.get('test.value'), '請');
            next();
        });
    });


    it('should reload bundles when caching disabled', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, fallbackLocale);
        bundle = content.getBundle('test', 'en_US');
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isNull(err);
            assert.isObject(bundle);
            assert.notEqual(content.getBundle('test', 'en_US'), bundle);
            next();
        });
    });


    it('should cache bundles when caching enabled', function (next) {
        var content, bundle;

        content = provider.create(contentRoot, fallbackLocale, true);
        bundle = content.getBundle('test', 'en_US');
        assert.isObject(bundle);

        bundle.load(function (err, bundle) {
            assert.isNull(err);
            assert.isObject(bundle);
            assert.strictEqual(content.getBundle('test', 'en_US'), bundle);
            next();
        });
    });

});