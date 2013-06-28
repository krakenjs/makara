/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';


var util = require('../lib/util'),
    assert = require('chai').assert;


describe('util', function () {

    it('should parse language tags', function () {
        var lang, pair;

        lang = 'en';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, 'en');
        assert.strictEqual(pair.country, '');

        lang = 'en_US';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, 'en');
        assert.strictEqual(pair.country, 'US');

        lang = 'en-US';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, 'en');
        assert.strictEqual(pair.country, 'US');

        lang = 'EN-US';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, 'en');
        assert.strictEqual(pair.country, 'US');

        lang = 'EN-us';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, 'en');
        assert.strictEqual(pair.country, 'US');

        lang = undefined;
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, '');
        assert.strictEqual(pair.country, '');

        lang = '';
        pair = util.parseLangTag(lang);
        assert.isObject(pair);
        assert.strictEqual(pair.language, '');
        assert.strictEqual(pair.country, '');
    });


});

