'use strict';

var util = require('util'),
    path = require('path');


var handler = {

    onTag: function (def, callback) {
        var attrs, key, before, after, sep;


        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null);
            return;
        }

        attrs = def.attributes;
        key = attrs.key;
        before = attrs.before || '';
        after = attrs.after || '';
        sep = attrs.sep || '';

        // Lazy load content for this bundle. (noop if already loaded)
        this.bundle.load(function (err, bundle) {
            var value;

            if (err) {
                callback(err);
                return;
            }

            value = bundle.get(key);
            if (value && !Array.isArray(value)) {
                value = [value];
            }

            value = value.map(function (str, idx) {
                var a, b;

                str = str.replace(/\$idx/g, idx);
                a = after.replace(/\$idx/g, idx);
                b = before.replace(/\$idx/g, idx);

                return b + str + a;
            });

            callback(null, value.join(sep));
        });
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