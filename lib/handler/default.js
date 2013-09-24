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

        if (!this.bundle) {
            throw new Error('Bundle not found.');
        }

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

            } else if (typeof value === 'object' && value !== null) {

                // Object or Array
                if (mode === 'json') {
                    value = JSON.stringify(value, self._substitute);
                } else if (mode === 'paired') {
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

    // Replace any $idx or $key values in the element   
    _substitute: function (key, value) {
        if (typeof value === 'string') {
            var regidx = new RegExp("\\$idx", 'g');
            var regkey = new RegExp("\\$key", 'g');
            // Test for numeric value. If non-numeric, use $key, else $idx
            var regex = isNaN(parseInt(key, 10)) ? regkey : regidx;
            value = value.replace(regex, key);
        }
        return value;
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


    _asObject: function asObj(obj) {
        var regidx = new RegExp("\\$idx", 'g');
        var regkey = new RegExp("\\$key", 'g');
        var regex = Array.isArray(obj) ? regidx : regkey;
        var self = this;

        return function objectPredicate(item) {
            var id = parseInt(item, 10);
            if (typeof obj[item] === 'object') {
                var child =  self._transform(obj[item], self._asObject(obj[item]));
                return {
                    '$id': isNaN(id) ? item : id,
                    '$elt': child
                };
            }
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
