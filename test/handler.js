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
            it: 'should gracefully handle missing \'key\' attribute.',
            input: 'Hello, {@pre type="content" /}!',
            expected: 'Hello, ☃undefined☃!'
        },
        {
            it: 'should replace a pre tag with localized content and support mode=json',
            input: 'Hello, {@pre type="content" key="name" mode="json"/}!',
            expected: 'Hello, \"world\"!'
        },
        {
            it: 'should replace a pre tag with localized content, support mode=json and ignore before/after',
            input: 'Hello, {@pre type="content" key="name" mode="json" before="[" after="]" /}!',
            expected: 'Hello, \"world\"!'
        },
        {
            it: 'should replace a pre tag with localized content and support before/after',
            input: 'Hello, {@pre type="content" key="name" before="[" after="]" /}!',
            expected: 'Hello, [world]!'
        },
        {
            it: 'should handle escaping',
            input: '{@pre type="content" key="textQuote"/}',
            expected: '\"This has quotes\"'
        },
        {
            it: 'should handle backslash escaping',
            input: '{@pre type="content" key="backslashQuote"/}',
            expected: 'I\\O'
        },
        {
            it: 'should handle control escaping',
            input: '{@pre type="content" key="controlQuote"/}',
            expected: 'tab\ttab'
        },
        {
            it: 'should handle escaping',
            input: '{@pre type="content" key="textQuote" mode="json"/}',
            expected: '\"\\"This has quotes\\"\"'
        },
        {
            it: 'should handle backslash escaping',
            input: '{@pre type="content" key="backslashQuote" mode="json"/}',
            expected: '\"I\\\\O\"'
        },
        {
            it: 'should handle control escaping',
            input: '{@pre type="content" key="controlQuote" mode="json"/}',
            expected: '\"tab\\ttab\"'
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
                it: 'should support the "mode" attribute',
                input: '{@pre type="content" key="states" mode="json" /}',
                expected: '[{"$id":0,"$elt":"CA"},{"$id":1,"$elt":"MI"},{"$id":2,"$elt":"OR"}]'
            },
            {
                it: 'should support the "mode" attribute and escape correctly',
                input: '{@pre type="content" key="listQuote" mode="json" /}',
                expected: '[{"$id":0,"$elt":"\\"This has quotes\\""},{"$id":1,"$elt":"I\\\\O"},{"$id":2,"$elt":"tab\\ttab"}]'
            },
            {
                it: 'should support "mode" and ignore before/after when present',
                input: '{@pre type="content" key="states" mode="json" before="->" after="->"/}',
                expected: '[{"$id":0,"$elt":"CA"},{"$id":1,"$elt":"MI"},{"$id":2,"$elt":"OR"}]'
            },
            {
                it: 'should support "mode" and ignore sep when present',
                input: '{@pre type="content" key="states" mode="json" sep="+" /}',
                expected: '[{"$id":0,"$elt":"CA"},{"$id":1,"$elt":"MI"},{"$id":2,"$elt":"OR"}]'
            },
            {
                it: 'should support the "mode" attribute and substitute $idx in content',
                input: '{@pre type="content" key="names" mode="json" /}',
                expected: '[{"$id":0,"$elt":"0. Larry"},{"$id":1,"$elt":"1. Moe"},{"$id":2,"$elt":"2. Curly"}]'
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
                it: 'should replace $idx placeholders in content strings',
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


    describe('map', function () {

        var scenarios = [
            {
                it: 'should recognize map type',
                input: 'Hello, {@pre type="content" key="state" /}!',
                expected: 'Hello, CaliforniaMichiganOregon!'
            },
            {
                it: 'should support the "sep" attribute',
                input: 'Hello: {@pre type="content" key="state" sep=", " /}!',
                expected: 'Hello: California, Michigan, Oregon!'
            },
            {
                it: 'should allow newlines',
                input: 'Hello:\r\n{@pre type="content" key="state" sep="\r\n" /}!',
                expected: 'Hello:\r\nCalifornia\r\nMichigan\r\nOregon!'
            },
            {
                it: 'should support the "mode" attribute',
                input: '{@pre type="content" key="state" mode="json" /}',
                expected: '[{\"$id\":\"CA\",\"$elt\":\"California\"},{\"$id\":\"MI\",\"$elt\":\"Michigan\"},{\"$id\":\"OR\",\"$elt\":\"Oregon\"}]'
            },
            {
                it: 'should support the "mode" attribute and ignore before/after if present',
                input: '{@pre type="content" key="state" mode="json" before="->" after="->" /}',
                expected: '[{\"$id\":\"CA\",\"$elt\":\"California\"},{\"$id\":\"MI\",\"$elt\":\"Michigan\"},{\"$id\":\"OR\",\"$elt\":\"Oregon\"}]'
            },
            {
                it: 'should support the "mode" attribute and ignore sep if present',
                input: '{@pre type="content" key="state" mode="json" sep="+" /}',
                expected: '[{\"$id\":\"CA\",\"$elt\":\"California\"},{\"$id\":\"MI\",\"$elt\":\"Michigan\"},{\"$id\":\"OR\",\"$elt\":\"Oregon\"}]'
            },
            {
                it: 'should support the "mode" attribute and substitute $idx in content',
                input: '{@pre type="content" key="stooge" mode="json" /}',
                expected: '[{\"$id\":\"Larry\",\"$elt\":\"Larry Fine\"},{\"$id\":\"Moe\",\"$elt\":\"Moe Howard\"},{\"$id\":\"Curly\",\"$elt\":\"Curly Howard\"},{\"$id\":\"Shemp\",\"$elt\":\"Shemp Howard\"}]'
            },
            {
                it: 'should support the "after" attribute',
                input: 'Hello: {@pre type="content" key="state" after="->" /}!',
                expected: 'Hello: California->Michigan->Oregon->!'
            },
            {
                it: 'should support the "before" and "after" attributes',
                input: '<ul>{@pre type=content key=state before="<li>" after="</li>" /}</ul>',
                expected: '<ul><li>California</li><li>Michigan</li><li>Oregon</li></ul>'
            },
            {
                it: 'should support the "before," "after," and "sep" attributes',
                input: '<ul>{@pre type=content key=state before="<li>" after="</li>" sep="\r\n" /}</ul>',
                expected: '<ul><li>California</li>\r\n<li>Michigan</li>\r\n<li>Oregon</li></ul>'
            },
            {
                it: 'should replace $key placeholders in content strings',
                input: 'Hello: {@pre type="content" key="stooge" sep=", " /}',
                expected: 'Hello: Larry Fine, Moe Howard, Curly Howard, Shemp Howard'
            },
            {
                it: 'should replace $key placeholders in before and after attributes, but not sep',
                input: 'Hello: {@pre type="content" key="state" before="$key " after=" $key" sep=", $key " /}',
                expected: 'Hello: CA California CA, $key MI Michigan MI, $key OR Oregon OR'
            },
            {
                it: 'should support option list with attributes',
                input: '<select>{@pre type=content key=months before="<option value=$key>" after="</option>" /}</select>',
                expected: '<select><option value=1>1</option><option value=2>2</option><option value=3>3</option></select>'
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
