/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
'use strict';

var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
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
            root : file.replace(name, ''),
            file: file,
            ext: path.extname(name).substr(1),
            name: name.replace(path.extname(name), ''),
            dirs: removed
        };
    }

    if (start === root) {
        return {
            root : undefined,
            file: undefined,
            ext: path.extname(name).substr(1),
            name: name.replace(path.extname(name), ''),
            dirs: removed
        };
    }

    parent = path.dirname(start);
    removed.push(path.relative(parent, start));
    return locate(name, root, parent, removed);
};


exports.md5 = function () {
    var hash;

    hash = crypto.createHash('md5');
    Array.prototype.slice.call(arguments).forEach(function (arg) {
        hash.update(String(arg), 'utf8');
    });

    return hash.digest('hex');
};