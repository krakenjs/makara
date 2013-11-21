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