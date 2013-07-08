'use strict';

var util = require('util'),
    path = require('path'),
    content = require('./../contentBundle');


var handler = {

    onTag: function (def, callback) {
        var that = this;

        if (def.attributes.type !== 'content') {
            // TODO - Don't think this works as intended yet.
            callback(null);
            return;
        }

        if (this._bundle) {
            // This handler has been visited so get content, if available.
            callback(null, this._bundle.get(def.attributes.key));
            return;
        }

        // Lazy load content for this particular bundle.
        content.create(this._fileInfo, function (err, bundle) {
            if (err) {
                callback(err);
                return;
            }
            that._bundle = bundle;
            that.onTag(def, callback);
        });
    }

};


exports.create = function (fileInfo) {
    var bundle;

    if (content.isContentBundle(fileInfo)) {
        bundle = fileInfo;
        fileInfo = undefined;
    }

    return Object.create(handler, {

        tags: {
            value: 'pre'
        },

        _fileInfo: {
            value: fileInfo
        },

        _bundle: {
            writable: true,
            value: bundle
        }

    });
};