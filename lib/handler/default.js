/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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

            value = bundle.get(key);

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
            var str, b, a;

            str = obj[item].replace(regex, item);
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
