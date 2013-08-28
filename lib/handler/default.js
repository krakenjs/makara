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

//// Generate output for list and map cases
//function generateStructuredOutput(mode, value, before, after, sep) {
//    var isMap = false,
//        objValue;
//
//    // If not an array, save original value object and make array from the keys
//    if (!Array.isArray(value)) {
//        isMap = true;
//        objValue = value;
//        value = Object.keys(value);
//
//    }
//    // mode="json" causes us to emit a JSON array for the content list
//    if (mode === 'json') {
//        value = value.map(function (str, idx) {
//            if (isMap) {
//                return generateElementAsObject(objValue[str], str, /\$key/g);
//            } else {
//                return generateElementAsObject(str, idx, /\$idx/g);
//            }
//        });
//        value =  JSON.stringify(value);
//    } else {
//        value = value.map(function (str, idx) {
//            if (isMap) {
//                return generateElementAsString(objValue[str], str, /\$key/g, before, after);
//            } else {
//                return generateElementAsString(str, idx, /\$idx/g, before, after);
//            }
//        }).join(sep);
//    }
//    return value;
//}
//
//// Form object {"$id": idx, "$elt": str} with regex substitution
//function generateElementAsObject(str, idx,  regex) {
//    var obj = {};
//    obj.$id = idx;
//    obj.$elt = str.replace(regex, idx);
//    return obj;
//}
//
//// Form string wrapped in before/after with regex substitution
//function generateElementAsString(str, idx, regex, before, after) {
//    str = str.replace(regex, idx);
//    return before.replace(regex, idx) + str + after.replace(regex, idx);
//}

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
