/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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