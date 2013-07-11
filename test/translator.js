/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    provider = require('../lib/provider'),
    translator = require('../lib/translator');


describe('translator', function () {

    var content, templateRoot;

    before(function () {
        var contentRoot, fallbackLocale;

        contentRoot = path.join(process.cwd(), 'test', 'fixtures', 'locales');
        fallbackLocale = 'en_US';

        content = provider.create(contentRoot, fallbackLocale);
        templateRoot = path.join(process.cwd(), 'test', 'fixtures', 'public', 'templates');
    });


    it('should create an instance', function () {
        var trans = translator.create(content, templateRoot);
        assert.isObject(trans);
    });


    describe('localize', function () {

        it('should localize a template', function (next) {
            var trans = translator.create(content, templateRoot);
            trans.localize('test', 'en-US', function (err, template) {
                assert.isNull(err);
                assert.ok(template);
                assert.strictEqual(template, '<p>Foo</p><p>{@helper attr="value"/} {randomData}</p><p>Bar</p><p>Baz</p>');
                next();
            });
        });


        it('should accept a locale object', function (next) {
            var trans = translator.create(content, templateRoot);
            trans.localize('test', { country: 'US', language: 'en' }, function (err, template) {
                assert.isNull(err);
                assert.ok(template);
                assert.strictEqual(template, '<p>Foo</p><p>{@helper attr="value"/} {randomData}</p><p>Bar</p><p>Baz</p>');
                next();
            });
        });


        it('should accept a custom template root', function (next) {
            var trans = translator.create(content, templateRoot);
            trans.localize('test', 'en-US', templateRoot, function (err, template) {
                assert.isNull(err);
                assert.ok(template);
                assert.strictEqual(template, '<p>Foo</p><p>{@helper attr="value"/} {randomData}</p><p>Bar</p><p>Baz</p>');
                next();
            });
        });


        it('should support non-localized templates', function (next) {
            var trans = translator.create(content, templateRoot);
            trans.localize('nobundle', 'en-US', function (err, template) {
                assert.isNull(err);
                assert.ok(template);
                assert.strictEqual(template, '<h1>No bundle</h1>');
                next();
            });
        });


        it('should support nested templates', function (next) {
            var trans = translator.create(content, templateRoot);
            trans.localize('inc/loc_partial', 'en-US', function (err, template) {
                assert.isNull(err);
                assert.ok(template);
                assert.strictEqual(template, '<h1>Intentionally left blank.</h1>');
                next();
            });
        });

    });


});