'use strict';

var util = require('util'),
    ent = require('ent');


var ANNOTATION = '<edit data-key="%s" data-bundle="%s" data-original="%s">%s</edit>';

var CHAR_MAP = ['{', '}'].reduce(function (prev, curr) {
    prev[curr] = '&#' + curr.charCodeAt(0) + ';';
    return prev;
}, {});


exports.decorate = function (bundle) {

    var prototype = Object.create(bundle, {

        get: {
            writable: false,
            enumerable: false,
            value: function (key) {
                var that, value;

                that = this;
                value = this.super_.get(key);

                if (Array.isArray(value)) {
                    return value.map(function (str, idx) {
                        return that._format(key + '[' + idx + ']', str);
                    });
                }

                return this._format(key, value);
            }
        },

        load: {
            writable: false,
            enumerable: false,
            value: function (callback) {
                var that = this;
                return this.super_.load(function (err) {
                    // return the decoration version
                    callback(err, that);
                });
            }
        },

        super_: {
            writable: false,
            enumerable: false,
            value: bundle
        },

        _format: {
            writable: false,
            enumerable: false,
            value: function (key, str) {
                var orig, bundle;

                key = this._encode(key);
                orig = this._encode(str);
                bundle = this._encode(this.file);

                return util.format(ANNOTATION, key, bundle, orig, str);
            }
        },

        _encode: {
            writable: false,
            enumerable: false,
            value: function (str) {
                str = ent.encode(str || '');
                return str.split('').map(function (chr) {
                    return CHAR_MAP[chr] || chr;
                }).join('');
            }
        }

    });

    return Object.create(prototype);

};