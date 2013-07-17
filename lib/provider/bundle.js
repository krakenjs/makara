'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    tater = require('tater');

var missing = '☃%s☃';

var prototype = {

    get: function get(key) {
        var namespace, value;

        if (!this._data) {
            throw new Error('Bundle not loaded.');
        }

        namespace = key.split('.');
        value = this._data;

        while (value && namespace.length) {
            value = value[namespace.shift()];
        }

        if (typeof value !== 'string' && !Array.isArray(value)) {
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

        tater.deserialize(fs.createReadStream(this.file), this.type, function (err, data) {
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