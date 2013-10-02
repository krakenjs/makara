/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var util = require('util'),
    cache = require('../lib/cache'),
    dustjs = require('dustjs-linkedin'),
    assert = require('chai').assert;

var COMPILED_TEMPLATE = '(function(){dust.register("%s",body_0);function body_0(chk,ctx){return "%s-%s";} return body_0;})();';

describe('cache', function () {

    var model;
    var config;
    var provider;

    before(function () {
        model = {
            locality: {
                country: 'CN',
                language: 'zh'
            }
        };

        config = {
            fallback: {
                country: 'US',
                language: 'en'
            }
        };

        provider = function (name, context, callback) {
            if (!context.locality) {
                context.locality = config.fallback
            }
            callback(null, util.format(COMPILED_TEMPLATE, name, context.locality.language, context.locality.country));
        };
    });


    it('should create a cache', function () {
        var tmplCache = cache.create(provider, config.fallback);
        dustjs.onLoad = tmplCache.get.bind(tmplCache);
    });


    it('should get a value', function (next) {
        dustjs.onLoad('key', model, function (err, data) {
            assert.ok(!err);
            assert.isFunction(data);
            assert.strictEqual(data.name, 'body_0');
            assert.strictEqual(data(), 'zh-CN');
            next();
        });
    });


    it('should use fallback if no locality provided', function (next) {
        dustjs.onLoad('key2', {}, function (err, data) {
            assert.ok(!err);
            assert.isFunction(data);
            assert.strictEqual(data.name, 'body_0');
            assert.strictEqual(data(), 'en-US');
            next();
        });
    });

});