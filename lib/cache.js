/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
'use strict';

var vm = require('vm'),
    util = require('./util'),
    assert = require('assert');



var cache = {

    get dataProvider() {
        return this._dataProvider;
    },


    set dataProvider(value) {
        this._dataProvider = value;
    },


    get fallback() {
        return this._fallback;
    },


    set fallback(value) {
        this._fallback = value;
    },


    get: function (name, context, callback) {
        var that, subContext, locality, value;

        that = this;
        subContext = (typeof context.get === 'function' && context.get('context')) || context;
        locality = subContext.locality || this._fallback;
        value = this._get(locality.country || '*', locality.language || '*', name);

        if (value !== undefined) {
            callback(null, value);
            return;
        }

        this._dataProvider(name, context, function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            data = that._set(locality.country || '*', locality.language || '*', name, data);
            callback(null, data);
        });
    },


    reset: function () {
        this._data = Object.create(null);
    },


    _get: function (country, lang, name) {
        var hash = util.md5.apply(undefined, arguments);
        return this._sandbox.dust.cache[hash];
    },


    _set: function (country, lang, name, data) {
        var args, value, hash, sandbox, cache;

        args = Array.prototype.slice.call(arguments);
        value = args.pop();
        hash = util.md5.apply(undefined, args);

        sandbox = this._sandbox;
        cache = sandbox.dust.cache;

        // Execute the template in the sandbox and then move it.
        vm.runInContext(value, sandbox, 'cache.vm');
        cache[hash] = cache[name];
        delete cache[name];
        return cache[hash];
    }
};


exports.create = function (provider, fallback) {
    assert(provider, 'No data provider implementation found.');

    var sandbox = {
        dust: {
            cache: {},
            register: function (name, fn) {
                this.cache[name] = fn;
            }
        }
    };

    return Object.create(cache, {

        _sandbox: {
            writable: true,
            value: vm.createContext(sandbox)
        },

        _dataProvider: {
            writable: true,
            value: provider
        },

        _fallback: {
            writable: true,
            value: util.parseLangTag(fallback)
        }

    });
};