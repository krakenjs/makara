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
'use strict';

var util = require('util'),
    path = require('path');


var handler = {

    REGIDX: new RegExp('\\$idx', 'g'),
    REGKEY: new RegExp('\\$key', 'g'),

    onTag: function (def, callback) {
        var self, attrs, key, before, after, mode, sep;

        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null, '');
            return;
        }

        self = this;
        attrs = def.attributes;
        key = attrs.key;
        before = attrs.before || '';
        after = attrs.after || '';
        mode = attrs.mode || '';
        sep = attrs.sep || '';

        if (!this.bundle) {
            throw new Error('Bundle not found.');
        }

        // Lazy load content for this bundle. (noop if already loaded)
        this.bundle.load(function (err, bundle) {
            var value;

            if (err) {
                callback(err);
                return;
            }

            value = bundle.get(key, { editable: attrs.editable || '' });

            if (typeof value === 'string') {

                value = (mode === 'json') ? JSON.stringify(value) : (before + value + after);

            } else if (typeof value === 'object' && value !== null) {

                // Object or Array
                if (mode === 'json') {
                    value = JSON.stringify(value, self._substitute);
                } else if (mode === 'paired') {
                    value = self._transform(value, self._asObject(value));
                    value = JSON.stringify(value);
                } else {
                    value = self._transform(value, self._asString(value, before, after));
                    value = value.join(sep);
                }

            } else {
                // number, bool, date, etc? not likely, but maybe
                value = String(value);
            }

            callback(null, value);
        });
    },

    // Replace any $idx or $key values in the element   
    _substitute: function (key, value) {
        if (typeof value === 'string') {
            // Test for numeric value. If non-numeric, use $key, else $idx
            var regex = isNaN(parseInt(key, 10)) ? handler.REGKEY : handler.REGIDX;
            value = value.replace(regex, key);
        }
        return value;
    },

    _asString: function (obj, before, after) {
        var regex = Array.isArray(obj) ? handler.REGIDX : handler.REGKEY;

        return function stringPredicate(item) {
            var str, b, a, objItem;

            objItem = obj[item];
            // If mode parameter is missing on nested object, fail soft.
            if (typeof objItem !== 'string') {
                return '';
            }
            str = objItem.replace(regex, item);
            b = before.replace(regex, item);
            a = after.replace(regex, item);

            return b + str + a;
        };
    },


    _asObject: function asObj(obj) {
        var regex = Array.isArray(obj) ? handler.REGIDX : handler.REGKEY;
        var self = this;

        return function objectPredicate(item) {
            var id = parseInt(item, 10);
            if (typeof obj[item] === 'object') {
                var child =  self._transform(obj[item], self._asObject(obj[item]));
                return {
                    '$id': isNaN(id) ? item : id,
                    '$elt': child
                };
            }
            return {
                '$id': isNaN(id) ? item : id,
                '$elt': obj[item].replace(regex, item)
            };
        };

    },

    _transform: function (obj, predicate) {
        return Object.keys(obj).map(predicate);
    }

};

exports.create = function (bundle) {

    return Object.create(handler, {
        tags: {
            value: 'pre'
        },

        bundle: {
            value: bundle
        }
    });

};
