'use strict';

var util = require('util'),
    ent = require('ent');

var metadata = {

    _format: function (def, str) {
        var key, bundle, orig;

        key = ent.encode(def.attributes.key || '');
        bundle = ent.encode(this._handler._bundle || '');
        orig = ent.encode(str || '');

        return util.format(this._pattern, key, bundle, orig, str);
    },

    onTag: function (def, callback) {
        var that = this;
        this._handler.onTag(def, function (err, str) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, that._format(def, str));
        });
    }

};

exports.decorate = function (handler) {
    return Object.create(metadata, {
        tags: { value: handler.tags },
        _handler: { value: handler },
        _pattern: { value: '<edit data-key="%s" data-bundle="%s" data-original="%s">%s</edit>' }
    });
};