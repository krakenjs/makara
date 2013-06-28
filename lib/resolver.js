'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('./util'),
    assert = require('assert');


function Resolver(config) {
    config = config || {};

    assert(config.root, 'root is not defined. A root directory must be specified.');
    assert(config.ext, 'ext is not defined. A file extension is required.');

    this._root = config.root;
    this._fallback = util.parseLangTag(config.fallback);
    this._ext = config.ext;

    if (this._ext[0] !== '.') {
        this._ext = '.' + this._ext;
    }
}


Resolver.prototype = {

    /**
     * Finds a file that matches the provided name, falling back to a root directory.
     * @param name
     * @param locality
     * @returns {*}
     */
    resolve: function (name, locality) {
        var filename, dir, file;

        locality = locality || this._fallback;

        filename = name + this._ext;
        dir = path.join(this._root, locality.country, locality.language);
        file = path.join(dir, filename);

        while (!fs.existsSync(file) && dir !== this._root) {
            dir = path.dirname(dir);
            file = path.join(dir, filename);
        }

        if (!fs.existsSync(file) && dir === this._root) {
            file = undefined;
            if (locality !== this._fallback) {
                dir = path.join(this._root, this._fallback.country, this._fallback.language);
                file = path.join(dir, filename);

                while (!fs.existsSync(file) && dir !== this._root) {
                    dir = path.dirname(dir);
                    file = path.join(dir, filename);
                }

                if (!fs.existsSync(file)) {
                    file = undefined;
                }
            }
        }

        return file;
    }

};


exports.create = function (config) {
    return new Resolver(config);
};