/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var path = require('path'),
    finder = require('findatag'),
    assert = require('chai').assert,
    handler = require('../lib/handler/default'),
    bundle = require('../lib/provider/bundle'),
    metadata = require('../lib/provider/metadata');


describe('metadata', function () {

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

        var content = bundle.create(fileInfo);
        metadata.decorate(content).load(function (err, content) {
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
            expected: 'Hello, <edit data-key="name" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="world">world</edit>!'
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
                expected: 'Hello, <edit data-key=\"states[0]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"CA\">CA</edit><edit data-key=\"states[1]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"MI\">MI</edit><edit data-key=\"states[2]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"OR\">OR</edit>!'
            },
            {
                it: 'should support the "sep" attribute',
                input: 'Hello: {@pre type="content" key="states" sep=", " /}!',
                expected: 'Hello: <edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit>, <edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit>, <edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit>!'
            },
            {
                it: 'should allow newlines',
                input: 'Hello:\r\n{@pre type="content" key="states" sep="\r\n" /}!',
                expected: 'Hello:\r\n<edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit>\r\n<edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit>\r\n<edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit>!'
            },
            {
                it: 'should support the "before" attribute',
                input: 'Hello: {@pre type="content" key="states" before="->" /}!',
                expected: 'Hello: -><edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit>-><edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit>-><edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit>!'
            },
            {
                it: 'should support the "after" attribute',
                input: 'Hello: {@pre type="content" key="states" after="->" /}!',
                expected: 'Hello: <edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit>-><edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit>-><edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit>->!'
            },
            {
                it: 'should support the "before" and "after" attributes',
                input: '<ul>{@pre type=content key=states before="<li>" after="</li>" /}</ul>',
                expected: '<ul><li><edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit></li><li><edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit></li><li><edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit></li></ul>'
            },
            {
                it: 'should support the "before," "after," and "sep" attributes',
                input: '<ul>{@pre type=content key=states before="<li>" after="</li>" sep="\r\n" /}</ul>',
                expected: '<ul><li><edit data-key="states[0]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="CA">CA</edit></li>\r\n<li><edit data-key="states[1]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="MI">MI</edit></li>\r\n<li><edit data-key="states[2]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="OR">OR</edit></li></ul>'
            }
        ];

        buildScenarios(scenarios);

    });


    describe('map', function () {

        var scenarios = [
            {
                it: 'should recognize list type',
                input: 'Hello, {@pre type="content" key="state" /}!',
                expected: 'Hello, <edit data-key=\"state[CA]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"California\">California</edit><edit data-key=\"state[MI]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"Michigan\">Michigan</edit><edit data-key=\"state[OR]\" data-bundle=\"' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties\" data-original=\"Oregon\">Oregon</edit>!'
            },
            {
                it: 'should support the "sep" attribute',
                input: 'Hello: {@pre type="content" key="state" sep=", " /}!',
                expected: 'Hello: <edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit>, <edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit>, <edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit>!'
            },
            {
                it: 'should allow newlines',
                input: 'Hello:\r\n{@pre type="content" key="state" sep="\r\n" /}!',
                expected: 'Hello:\r\n<edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit>\r\n<edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit>\r\n<edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit>!'
            },
            {
                it: 'should support the "before" attribute',
                input: 'Hello: {@pre type="content" key="state" before="->" /}!',
                expected: 'Hello: -><edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit>-><edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit>-><edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit>!'
            },
            {
                it: 'should support the "after" attribute',
                input: 'Hello: {@pre type="content" key="state" after="->" /}!',
                expected: 'Hello: <edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit>-><edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit>-><edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit>->!'
            },
            {
                it: 'should support the "before" and "after" attributes',
                input: '<ul>{@pre type=content key=state before="<li>" after="</li>" /}</ul>',
                expected: '<ul><li><edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit></li><li><edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit></li><li><edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit></li></ul>'
            },
            {
                it: 'should support the "before," "after," and "sep" attributes',
                input: '<ul>{@pre type=content key=state before="<li>" after="</li>" sep="\r\n" /}</ul>',
                expected: '<ul><li><edit data-key="state[CA]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="California">California</edit></li>\r\n<li><edit data-key="state[MI]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Michigan">Michigan</edit></li>\r\n<li><edit data-key="state[OR]" data-bundle="' + process.cwd()  + '/test/fixtures/locales/US/en/handler.properties" data-original="Oregon">Oregon</edit></li></ul>'
            }
        ];

        buildScenarios(scenarios);

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