'use strict';

var util = require('util'),
    path = require('path');


var handler = {

    onTag: function (def, callback) {
        var attrs, key, before, after, sep;

        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null, '');
            return;
        }

        attrs = def.attributes;
        key = attrs.key;
        before = attrs.before || '';
        after = attrs.after || '';
        var mode = attrs.mode || '';
        sep = attrs.sep || '';

        // Lazy load content for this bundle. (noop if already loaded)
        this.bundle.load(function (err, bundle) {
            var value,
                arrlist;

            if (err) {
                callback(err);
                return;
            }

            value = bundle.get(key);
            if (typeof value === 'string') {
                value = before + value + after;

            } else if (Array.isArray(value)) {
                value = generateListOutput(mode, value, before, after, sep);
            } else if (typeof value === 'object') {
                value = generateObjectOutput(mode, value, before, after, sep);
            } else {
                // number, bool, date, etc? not likely, but maybe
                value = String(value);
            }


            callback(null, value);
        });
    }

};


function generateListOutput(mode, value, before, after, sep) {
    var arrlist = [],
        a,
        b,
        obj;

    // mode="json" causes us to emit a JSON array for the content list
    if (mode === 'json') {
        value = value.map(function (str, idx) {
            obj = {};
            str = str.replace(/\$idx/g, idx);
            obj.$id = idx;
            obj.$elt = str;
            arrlist.push(obj);
        });
        value =  JSON.stringify(arrlist);
    } else {
        value = value.map(function (str, idx) {
            str = str.replace(/\$idx/g, idx);
            a = after.replace(/\$idx/g, idx);
            b = before.replace(/\$idx/g, idx);

            return b + str + a;
        }).join(sep);
    }
    return value;
}

function generateObjectOutput(mode, value, before, after, sep) {
    var arrlist = [],
        a,
        b,
        obj,
        str;

    // mode="json" causes us to emit a JSON array for the content list
    if (mode === 'json') {
        arrlist = [];
        value = Object.keys(value).map(function (key) {
            str = value[key],
            obj = {};
            str = str.replace(/\$key/g, key);
            obj.$id = key;
            obj.$elt = str;
            arrlist.push(obj);
        });
        value = JSON.stringify(arrlist);
    } else {
        value = Object.keys(value).map(function (key) {
            str = value[key];
            str = str.replace(/\$key/g, key);
            a = after.replace(/\$key/g, key);
            b = before.replace(/\$key/g, key);

            return b + str + a;
        }).join(sep);
    }
    return value;
} 
  
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
