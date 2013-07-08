'use strict';

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    tater = require('tater');


var missing = '☃%s☃';

var prototype = {
    get: function get(key) {
        var namespace, value;

        namespace = key.split('.');
        value = this._data;

        while (value && namespace.length) {
            value = value[namespace.shift()];
        }

        if (typeof value !== 'string') {
            value = util.format(missing, key);
        }

        return String(value);
    }
};


exports.create = function (fileInfo, callback) {
    var type;

    function _create(err, data) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, Object.create(prototype, {

            _data: {
                value: data
            },

            file: {
                value: fileInfo.file
            },

            type: {
                value: type
            },

            name: {
                value: fileInfo.name
            }

        }));
    }

    if (!fileInfo.file) {
        callback(new Error('Content bundle not found: ' + fileInfo.file));
        return;
    }

    type = path.extname(fileInfo.file).substr(1);
    tater.deserialize(fs.createReadStream(fileInfo.file), type, _create);
};


/**
 * Add content bundle instance to provided file info object. If the provided argument is
 * an array, will recursively process file info objects.
 * @param fileInfo a file info object or array of file info objects.
 * @returns {*} promise
 */
exports.decorate = function decorate(fileInfo) {
    var deferred = Q.defer();

    exports.create(fileInfo, function (err, bundle) {
        if (err) {
            deferred.reject(err);
            return;
        }
        fileInfo.content = bundle;
        deferred.resolve(fileInfo);
    });

    return deferred.promise;
};


exports.isContentBundle = function (obj) {
    return prototype.isPrototypeOf(obj);
};

