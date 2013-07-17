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


    describe('create', function () {

        it('should accept a locale string', function () {
            var content = provider.create(contentRoot, 'en_US');
            assert.isObject(content);
            assert.isFalse(content.cache);
            assert.isFalse(content.htmlMetadataEnabled);

        });


        it('should accept a locale object', function () {
            var content = provider.create(contentRoot, { country: 'US', language: 'en' });
            assert.isObject(content);
            assert.isFalse(content.cache);
            assert.isFalse(content.htmlMetadataEnabled);
        });


        it('should support caching', function () {
            var content = provider.create(contentRoot, { country: 'US', language: 'en' }, true);
            assert.isObject(content);
            assert.isTrue(content.cache);
            assert.isFalse(content.htmlMetadataEnabled);
        });


        it('should support HTML metadata', function () {
            var content = provider.create(contentRoot, { country: 'US', language: 'en' }, false, true);
            assert.isObject(content);
            assert.isFalse(content.cache);
            assert.isTrue(content.htmlMetadataEnabled);
        });

    });


    describe('getBundle', function () {

        it('should support optional locale', function () {
            var content, bundle;

            content = provider.create(contentRoot, fallbackLocale);
            bundle = content.getBundle('test');
            assert.isObject(bundle);
        });


        it('should accept a locale string', function () {
            var content, bundle;

            content = provider.create(contentRoot, fallbackLocale);
            bundle = content.getBundle('test', 'en_US');
            assert.isObject(bundle);
        });


        it('should accept a locale object', function () {
            var content, bundle;

            content = provider.create(contentRoot, fallbackLocale);
            bundle = content.getBundle('test', { country: 'US', language: 'en' });
            assert.isObject(bundle);
        });


        it('should return new bundles when caching is disabled', function () {
            var content, bundle, otherBundle;

            content = provider.create(contentRoot, fallbackLocale, false);
            bundle = content.getBundle('test', 'en_US');
            otherBundle = content.getBundle('test', 'en_US');

            assert.isObject(bundle);
            assert.isObject(otherBundle);
            assert.notEqual(bundle, otherBundle);
        });


        it('should reuse bundles when caching enabled', function () {
            var content, bundle, otherBundle;

            content = provider.create(contentRoot, fallbackLocale, true);
            bundle = content.getBundle('test', 'en_US');
            otherBundle = content.getBundle('test', 'en_US');

            assert.isObject(bundle);
            assert.isObject(otherBundle);
            assert.strictEqual(bundle, otherBundle);
        });


        it('should add metadata to strings when setting is enabled', function () {
            var expected, content, bundle;

            expected = '<edit data-key="test.value" data-bundle="/Users/ertoth/PayPal/src/git/dustjs-i18n/test/fixtures/locales/US/en/test.properties" data-original="Foo">Foo</edit>';
            content = provider.create(contentRoot, fallbackLocale, false, true);
            bundle = content.getBundle('test', { country: 'US', language: 'en' });
            assert.isObject(bundle);

            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.strictEqual(bundle.get('test.value'), expected);
            });
        });


        it('should encode special characters when metadata is enabled', function () {
            var expected, content, bundle;

            expected = '<edit data-key="test.special" data-bundle="/Users/ertoth/PayPal/src/git/dustjs-i18n/test/fixtures/locales/US/en/test.properties" data-original="Hello, &#123;name&#125;!">Hello, {name}!</edit>';
            content = provider.create(contentRoot, fallbackLocale, false, true);
            bundle = content.getBundle('test', { country: 'US', language: 'en' });
            assert.isObject(bundle);

            bundle.load(function (err, bundle) {
                assert.isNull(err);
                assert.isObject(bundle);
                assert.strictEqual(bundle.get('test.special'), expected);
            });
        });

    });

});