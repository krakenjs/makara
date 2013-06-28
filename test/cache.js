/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var cache = require('../lib/cache'),
    dustjs = require('dustjs-linkedin'),
    assert = require('chai').assert;


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
            callback(null, [name, context.locality.language, context.locality.country].join('-'));
        };
    });


    it('should create a cache', function () {
        dustjs.onLoad = provider;
        cache.decorate(dustjs, config);
    });


    it('should get a value', function (next) {
        dustjs.onLoad('key', model, function (err, data) {
            assert.ok(!err);
            assert.strictEqual(data, 'key-zh-CN');
            next();
        });
    });


    it('should use fallback if no locality provided', function (next) {
        dustjs.onLoad('key2', {}, function (err, data) {
            assert.ok(!err);
            assert.strictEqual(data, 'key2-en-US');
            next();
        });
    });

});