 /*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
 /*jshint proto:true*/
'use strict';

var util = require('util'),
    ent = require('ent');


var ANNOTATION = '<edit data-key="%s" data-bundle="%s" data-original="%s">%s</edit>';

var CHAR_MAP = ['{', '}'].reduce(function (prev, curr) {
    prev[curr] = '&#' + curr.charCodeAt(0) + ';';
    return prev;
}, {});




exports.decorate = function (bundle) {

    var proto = {

        get: function (key, settings) {
            var that, value;

            that = this;
            value = this.super_.get(key, settings);

            if (settings && settings.editable === 'false') {
                return value;
            }

            if (Array.isArray(value)) {
                return value.map(function (str, idx) {
                    return that._format(key + '[' + idx + ']', str);
                });

            } else if (typeof value === 'object') {
                return Object.keys(value).map(function (name) {
                    return that._format(key + '[' + name + ']', value[name]);
                });

            } else {
                value = String(value);
            }

            return this._format(key, value);
        },

        load: function (callback) {
            var that = this;
            return this.super_.load(function (err) {
                // return the decorated version
                callback(err, that);
            });
        },

        _format: function (key, str) {
            var orig, bundle;

            key = this._encode(key);
            orig = this._encode(str);
            bundle = this._encode(this.file);

            return util.format(ANNOTATION, key, bundle, orig, str);
        },

        _encode: function (str) {
            str = ent.encode(str || '');
            return str.split('').map(function (chr) {
                return CHAR_MAP[chr] || chr;
            }).join('');
        }

    };

    proto.__proto__ = bundle;
    return Object.create(proto, {

        super_: {
            writable: false,
            enumerable: false,
            value: bundle
        }

    });

};