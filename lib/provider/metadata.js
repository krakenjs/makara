/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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