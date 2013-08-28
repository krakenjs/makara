'use strict';

var util = require('util'),
    path = require('path');


var handler = {

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

            } else if (typeof value === 'object') {

                // Object or Array
                if (mode === 'json') {
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

    _asString: function (obj, before, after) {
        var regex = Array.isArray(obj) ? /\$idx/g : /\$key/g;

        return function stringPredicate(item) {
            var str, b, a;

            str = obj[item].replace(regex, item);
            b = before.replace(regex, item);
            a = after.replace(regex, item);

            return b + str + a;
        };
    },


    _asObject: function (obj) {
        var regex = Array.isArray(obj) ? /\$idx/g : /\$key/g;

        return function objectPredicate(item) {
            var id = parseInt(item, 10);
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
