'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('./util'),
    assert = require('assert');



function Resolver(options) {
    options = options || {};

    assert(options.root, 'root is not defined. A root directory must be specified.');
    assert(options.ext, 'ext is not defined. A file extension is required.');

    this._root = options.root;
    this._fallback = util.parseLangTag(options.fallback);
    this._ext = options.ext;

    if (this._ext[0] !== '.') {
        this._ext = '.' + this._ext;
    }
}


Resolver.prototype = {

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
        that = this;

        [locale, this._fallback].every(function walk(locale) {
            match = that._locate(name, locale);
            return !(match && match.file);
        });

        return match;
    }

};


exports.create = function (options) {
    return new Resolver(options);
};