'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('./util'),
    assert = require('assert');


var proto = {

    get fallbackLocale() {
        return this._fallback;
    },

    _locate: function (name, locale) {
        var relative = locale ? path.join(this._root, locale.country, locale.language) : this._root;
        return util.locate(name, this._root, relative);
    },

    /**
     * Finds a file that matches the provided name, falling back to a root directory.
     * @param name
     * @param locale
     * @returns {*}
     */
    resolve: function (name, locale) {
        var that, match;

        name = name + this._ext;
        locale = util.parseLangTag(locale);
        that = this;

        [locale, this._fallback].every(function walk(locale) {
            match = that._locate(name, locale);
            return !(match && match.file);
        });

        return match;
    }

};



exports.create = function (options) {
    var ext;

    options = options || {};
    assert(options.root, 'root is not defined. A root directory must be specified.');
    assert(options.ext, 'ext is not defined. A file extension is required.');

    ext = options.ext;
    if (ext[0] !== '.') {
        ext = '.' + ext;
    }

    return Object.create(proto, {
        _root: {
            value: options.root
        },
        _fallback: {
            value: util.parseLangTag(options.fallback)
        },
        _ext: {
            value: ext
        }
    });
};