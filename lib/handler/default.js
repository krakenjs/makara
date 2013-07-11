'use strict';

var util = require('util'),
    path = require('path');


var handler = {

    onTag: function (def, callback) {
        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null);
            return;
        }

        // Lazy load content for this bundle.
        this.bundle.load(function (err, bundle) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, bundle.get(def.attributes.key));
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