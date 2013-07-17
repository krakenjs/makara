/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    finder = require('tagfinder'),
    assert = require('chai').assert,
    handler = require('../lib/handler/default'),
    bundle = require('../lib/provider/bundle');


describe('handler', function () {

    var tagHandler, test;

    function runScenario(scenario) {
        it(scenario.it, function (next) {
            // `test` is defined later, but prior to test cases being run
            test(scenario.input, scenario.expected, next);
        });
    }

    function buildScenarios(scenarios) {
        scenarios.forEach(runScenario);
    }


    before(function (next) {
        var fileInfo = {
            file: path.join(process.cwd(), 'test', 'fixtures', 'locales', 'US', 'en', 'handler.properties'),
            name: 'handler'
        };

        bundle.create(fileInfo).load(function (err, content) {
            if (err) {
                next(err);
                return;
            }

            tagHandler = handler.create(content);

            test = function test(str, expected, cb) {
                evaluate(str, tagHandler, function (err, result) {
                    assert.isNull(err);
                    assert.strictEqual(result, expected);
                    cb();
                });
            };

            next();
        });
    });



    var scenarios = [
        {
            it: 'should replace a pre tag with localized content',
            input: 'Hello, {@pre type="content" key="name" /}!',
            expected: 'Hello, world!'
        },
        {
            it: 'should ignore unrecognized tags',
            input: 'Hello, {@pre type="link" /}!',
            expected: 'Hello, !'
        }
    ];

    buildScenarios(scenarios);


    describe('list', function () {

        var scenarios = [
            {
                it: 'should recognize list type',
                input: 'Hello, {@pre type="content" key="states" /}!',
                expected: 'Hello, CAMIOR!'
            },
            {
                it: 'should support the "sep" attribute',
                input: 'Hello: {@pre type="content" key="states" sep=", " /}!',
                expected: 'Hello: CA, MI, OR!'
            },
            {
                it: 'should allow newlines',
                input: 'Hello:\r\n{@pre type="content" key="states" sep="\r\n" /}!',
                expected: 'Hello:\r\nCA\r\nMI\r\nOR!'
            },
            {
                it: 'should support the "before" attribute',
                input: 'Hello: {@pre type="content" key="states" before="->" /}!',
                expected: 'Hello: ->CA->MI->OR!'
            },
            {
                it: 'should support the "after" attribute',
                input: 'Hello: {@pre type="content" key="states" after="->" /}!',
                expected: 'Hello: CA->MI->OR->!'
            },
            {
                it: 'should support the "before" and "after" attributes',
                input: '<ul>{@pre type=content key=states before="<li>" after="</li>" /}</ul>',
                expected: '<ul><li>CA</li><li>MI</li><li>OR</li></ul>'
            },
            {
                it: 'should support the "before," "after," and "sep" attributes',
                input: '<ul>{@pre type=content key=states before="<li>" after="</li>" sep="\r\n" /}</ul>',
                expected: '<ul><li>CA</li>\r\n<li>MI</li>\r\n<li>OR</li></ul>'
            },
            {
                it: 'should replace $idx placeholders in values',
                input: 'Hello: {@pre type="content" key="names" after="->" /}',
                expected: 'Hello: 0. Larry->1. Moe->2. Curly->'
            },
            {
                it: 'should replace $idx placeholders in before and after attributes, but not sep',
                input: 'Hello: {@pre type="content" key="names" before="$idx" after="$idx" sep="$idx" /}',
                expected: 'Hello: 00. Larry0$idx11. Moe1$idx22. Curly2'
            }
        ];

        buildScenarios(scenarios);

    });


    it.skip('should recognize map types', function () {

    });

});


function evaluate(str, tagHandler, callback) {
    var stream, chunks;

    stream = finder.createParseStream(tagHandler);
    chunks = [];

    stream.on('data', function (chunk) {
        chunks.push(chunk);
    });

    stream.on('error', function (err) {
        callback(err);
    });

    stream.on('finish', function () {
        callback(null, Buffer.concat(chunks).toString('utf8'));
    });

    stream.write(str);
    stream.end();
}