'use strict';

var util = require('util'),
    content = require('./contentBundle');


var handler = {

    onTag: function (def, callback) {
        var that = this;

        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null);
            return;
        }

        if (this._content) {
            callback(null, this._content.get(def.attributes.key));
            return;
        }

        content.create(this._bundle, function (err, content) {
            if (err) {
                callback(err);
                return;
            }
            that._content = content;
            that.onTag(def, callback);
        });
    }

};


exports.create = function (bundle) {
    var content;

    if (typeof bundle !== 'string') {
        content = bundle;
        bundle = undefined;
    }

    return Object.create(handler, {

        tags: {
            value: 'pre'
        },

        _bundle: {
            value: bundle
        },

        _content: {
            writable: true,
            value: content
        }

    });
};