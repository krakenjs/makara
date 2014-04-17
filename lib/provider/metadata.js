 /*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
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

//Note the nasty hack on quotes here. The start and the end are expected to be in the template!
//Supporting multiple attributes (ex: data-key-attrName)
var ATTR_ANNOTATION = '%s" data-key-%s="%s" data-bundle-%s="%s" data-original-%s="%s';

var CHAR_MAP = ['{', '}'].reduce(function (prev, curr) {
    prev[curr] = '&#' + curr.charCodeAt(0) + ';';
    return prev;
}, {});




exports.decorate = function (bundle) {

    var proto = {

        get: function (key, settings) {
            var that, value, isEncoded;

            that = this;
            isEncoded = false;
            value = this.super_.get(key, settings);

            if (settings && settings.editable === 'false') {
                return value;
            }

            if (settings && settings.encode === 'true') {
                isEncoded = true;
            }
            //checking whether attribute name is present or not
            if (settings && typeof settings.attribute === 'string') {
                if (Array.isArray(value) || typeof value === 'object') {
                    return value;
                }
                return this._formatAttribute(key, value, isEncoded, settings.attribute);
            }


            if (Array.isArray(value)) {
                return value.map(function (str, idx) {
                    return that._format(key + '[' + idx + ']', str, isEncoded);
                });

            } else if (typeof value === 'object') {
                return Object.keys(value).map(function (name) {
                    return that._format(key + '[' + name + ']', value[name], isEncoded);
                });

            } else {
                value = String(value);
            }

            return this._format(key, value, isEncoded);
        },

        load: function (callback) {
            var that = this;
            return this.super_.load(function (err) {
                // return the decorated version
                callback(err, that);
            });
        },

        _format: function (key, str, isEncoded) {
            var orig, bundle, annotated;

            key = this._encode(key);
            orig = this._encode(str);
            bundle = this._encode(this.file);
            annotated = util.format(ANNOTATION, key, bundle, orig, str);

            if (isEncoded === true) {
                return this._encode(annotated);
            }

            return annotated;
        },

        _formatAttribute: function (key, str, isEncoded, attrName) {
            var orig, bundle, annotated;

            key = this._encode(key);
            orig = this._encode(str);
            bundle = this._encode(this.file);
            annotated = util.format(ATTR_ANNOTATION, orig, attrName, key, attrName, bundle, attrName, orig);

            if (isEncoded === true) {
                return this._encode(annotated);
            }

            return annotated;
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