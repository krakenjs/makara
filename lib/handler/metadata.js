'use strict';

var util = require('util'),
    ent = require('ent');

var ANNOTATION = '<edit data-key="%s" data-bundle="%s" data-original="%s">%s</edit>';

var metadata = {

    _format: function (def, str) {
        var key, bundle, orig;

        key = ent.encode(def.attributes.key || '');
        bundle = ent.encode(this._handler.bundle.file || '');
        orig = ent.encode(str || '');

        return util.format(this._pattern, key, bundle, orig, str);
    },

    onTag: function (def, callback) {
        var that = this;

        function decorate(err, str) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, that._format(def, str));
        }

        this._handler.onTag(def, decorate);
    }

};

exports.decorate = function (handler) {
    return Object.create(metadata, {

        tags: {
            value: handler.tags
        },

        _handler: {
            value: handler
        },

        _pattern: {
            writable: true,
            value: ANNOTATION
        }

    });
};