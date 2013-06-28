/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    i18n = require('../index'),
    express = require('express'),
    assert = require('chai').assert,
    dustjs = require('express-dustjs');


describe('i18n', function () {

    var DISABLED = '<p></p><p> </p><p></p><p></p>'; //pre tags get eaten by dust
    var LOCALIZED = '<p>Foo</p><p> </p><p>Bar</p><p>Baz</p>';
    var CN_LOCALIZED = '<p>請</p><p> </p><p>登</p><p>錄</p>';
    var NO_BUNDLE = '<h1>No bundle</h1>';
    var MISSING_BUNDLE = '<p>☃missingbundle.dur☃</p>';
    var INVALID_KEY = '<p>☃badkey.invalid☃</p>';

    var config;

    var app, engine, server, render;

    before(function (next) {
        // Ensure the test case assumes it's being run from application root.
        // Depending on the test harness this may not be the case, so shim.
        process.chdir(__dirname);

        config = {
            fallback: 'en_US',
            contentPath: path.join(process.cwd(), 'fixtures', 'locales'),
            cache: false
        };

        app = express();
        app.engine('dust', dustjs.dust({ cache: false }));
        app.engine('js', dustjs.js({ cache: false }));
        app.set('view cache', false);

        app.get('/*', function (req, res) {
            if (req.query.country || req.query.language) {
                res.locals.context = {
                    locality: req.query
                };
            }
            res.render(req.path.substr(1), { title: 'Hello, world!' });
        });

        engine = dustjs;
        server = app.listen(8000, next);
        render = app.render;
    });


    after(function (next) {
        server.once('close', next);
        server.close();
        engine.onLoad = undefined;
    });


    describe('dust', function () {

        before(function () {
            app.set('view engine', 'dust');
            app.set('views', path.join(process.cwd(), 'fixtures', 'public', 'templates'));
            i18n.init(app, config);
        });


        after(function () {
            app.render = render;
            engine.onLoad = undefined;
            //i18n.cache.reset();
        });


        it('should localize a dust file', function (next) {
            inject('/test?country=US&language=en', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, LOCALIZED);
                next();
            });
        });


        it('should localize a dust file in another language', function (next) {
            inject('/test?country=CN&language=zh', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, CN_LOCALIZED);
                next();
            });
        });


        it('should fallback to the fallback lang/locale when a bundle is not found', function (next) {
            inject('/test', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, LOCALIZED);
                next();
            });
        });


        it('should do nothing when the template is not localized and locality is defined', function (next) {
            inject('/nobundle?country=CN&language=zh', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, NO_BUNDLE);
                next();
            });
        });


        it('should do nothing when the template is not localized', function (next) {
            inject('/nobundle', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, NO_BUNDLE);
                next();
            });
        });


        it('should return an error when a template is localized but no bundle is available', function (next) {
            inject('/missingbundle', function (err, result) {
                assert.ok(err);
                assert.ok(!result);
                next();
            });
        });


        it('should notify of missing or malformed keys', function (next) {
            inject('/badkey', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, INVALID_KEY);
                next();
            });
        });


        describe('metadata', function () {

            var metadata = /<edit data-key=\"test.(?:(?:other)?[Vv]alue|content)\" data-bundle=\"[^"]+(?:\/test\/fixtures\/locales\/US\/en\/test.properties)\" data-original=\"[^"]+\">[^<]+<\/edit>/g;

            before(function () {
                config.enableMetadata = true;
                i18n.init(app, config);
            });


            after(function () {
                config.enableMetadata = false;
            });


            it('should localize a dust file with metadata', function (next) {
                inject('/test?country=US&language=en', function (err, result) {
                    var matcher;

                    assert.ok(!err);
                    assert.ok(result);

                    matcher = result.match(metadata);

                    assert.ok(matcher);
                    assert.strictEqual(matcher.length, 3);
                    next();
                });
            });
        });

    });


    describe('js', function () {

        var views;


        before(function () {
            app.set('view engine', 'js');
            app.set('views', path.join(process.cwd(), 'fixtures', 'build', 'templates'));
            i18n.init(app, config);
        });


        after(function () {
            app.render = render;
            engine.onLoad = undefined;
            //i18n.cache.reset();
        });


        it('should load a js template', function (next) {
            inject('/precompiled?country=CN&language=zh', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.ok(~result.indexOf('<p>登</p><p>錄</p>'));
                next();
            });
        });


        it('should fallback when loading a js template', function (next) {
            inject('/precompiled?country=US&language=en', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.ok(~result.indexOf('<p>Bar</p><p>Baz</p>'));
                next();
            });
        });

    });


    describe('caching', function () {

        var views;

        before(function () {
            config.cache = true;
            app.set('view engine', 'dust');
            app.set('views', path.join(process.cwd(), 'fixtures', 'public', 'templates'));
            i18n.init(app, config);
        });


        after(function () {
            app.render = render;
            engine.onLoad = undefined;
            config.cache = false;
            //i18n.cache.reset();
        });



        it('should load and cache a template', function (next) {
            inject('/test?country=US&language=en', function (err, result) {
                assert.ok(!err);
                assert.ok(result);
                assert.strictEqual(result, LOCALIZED);

                inject('/test?country=US&language=en', function (err, result) {
                    assert.ok(!err);
                    assert.ok(result);
                    assert.strictEqual(result, LOCALIZED);

                    inject('/test?country=US&language=en', function (err, result) {
                        assert.ok(!err);
                        assert.ok(result);
                        assert.strictEqual(result, LOCALIZED);

                        inject('/test?country=US&language=en', function (err, result) {
                            assert.ok(!err);
                            assert.ok(result);
                            assert.strictEqual(result, LOCALIZED);
                            next();
                        });
                    });
                });
            });
        });

    });

});


function inject(path, callback) {
    var req = http.request({ method: 'GET', port: 8000, path: path }, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk)
        });

        res.on('end', function () {
            var body = Buffer.concat(data).toString('utf8');
            if (res.statusCode !== 200) {
                callback(new Error(body));
                return;
            }
            callback(null, body);
        });
    });
    req.on('error', callback);
    req.end();
}
