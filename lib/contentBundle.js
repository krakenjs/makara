'use strict';

var fs = require('fs'),
    util = require('util'),
    tater = require('tater');


var missing = '☃%s☃';


exports.create = function (bundle, callback) {

    function _create(err, data) {

        function get(key) {
            var namespace, value;

            namespace = key.split('.');
            value = data;

            while (value && namespace.length) {
                value = value[namespace.shift()];
            }

            if (typeof value !== 'string') {
                value = util.format(missing, key);
            }

            return String(value);
        }

        if (err) {
            callback(err);
            return;
        }

        callback(null, { get: get });
    }

    if (!bundle) {
        callback(new Error('Content bundle not found: ' + bundle));
        return;
    }

    tater.deserialize(fs.createReadStream(bundle), 'properties', _create);
};