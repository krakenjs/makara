'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');


/**
 * Converts a lang tag (en-US, en, fr-CA) into an object with properties `country` and `locale`
 * @param str String a language tag in the format `en-US`, `en_US`, `en`, etc.
 * @returns {{language: string, country: string}}
 */
exports.parseLangTag = function (str) {
    var pair, tuple;

    if (typeof str === 'object') {
        return str;
    }

    pair = {
        language: '',
        country: ''
    };

    if (str) {
        tuple = str.split(/[-_]/);
        pair.language = (tuple[0] || pair.language).toLowerCase();
        pair.country = (tuple[1] || pair.country).toUpperCase();
    }

    return pair;
};


/**
 * Walks up a directory tree to find a particular file, stopping at the specified root.
 * @param name The name of the file to locate. May include parent directories (e.g. inc/foo.bar)
 * @param root The root directory at which to stop searching.
 * @param start The starting directory (must be descendent of root)
 * @returns {{file: *, name: string, dirs: array}}
 */
exports.locate = function locate(name, root, start) {
    var removed, file, parent;

    assert(~start.indexOf(root), 'Provided start directory is not within root or one of its subdirectories.');

    removed = arguments[3] || [];
    file = path.join(start, name);

    if (fs.existsSync(file)) {
        return {
            file: file,
            ext: path.extname(name).substr(1),
            name: path.basename(name, path.extname(name)),
            dirs: removed
        };
    }

    if (start === root) {
        return {
            file: undefined,
            ext: path.extname(name).substr(1),
            name: path.basename(name, path.extname(name)),
            dirs: removed
        };
    }

    parent = path.dirname(start);
    removed.push(path.relative(parent, start));
    return locate(name, root, parent, removed);
};