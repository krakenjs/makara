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

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    spud = require('spud');

var missing = '☃%s☃';

var prototype = {

    get: function get(key) {
        var namespace, value;

        if (!this._data) {
            throw new Error('Bundle not loaded.');
        }

        if (typeof key !== 'string') {
            return util.format(missing, String(key));
        }

        namespace = key.split('.');
        value = this._data;

        while (value && namespace.length) {
            value = value[namespace.shift()];
        }

        if (value === undefined || value === null) {
            value = util.format(missing, key);
        }

        return value;
    },

    load: function (callback) {
        var that = this;

        if (this._data) {
            callback(null, this);
            return;
        }

        if (!this.file) {
            callback(new Error('Content bundle not found: ' + this.file));
            return;
        }

        spud.deserialize(fs.createReadStream(this.file), this.type, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            that._data = data;
            that.load(callback);
        });
    }

};


exports.create = function (fileInfo) {

    return Object.create(prototype, {
        _data: {
            enumerable: false,
            writable: true,
            value: undefined
        },

        file: {
            enumerable: true,
            writable: false,
            value: fileInfo.file
        },

        type: {
            enumerable: true,
            writable: false,
            value: path.extname(fileInfo.file).substr(1)
        },

        name: {
            enumerable: true,
            writable: false,
            value: fileInfo.name
        }
    });
};


exports.isContentBundle = function (obj) {
    return prototype.isPrototypeOf(obj);
};