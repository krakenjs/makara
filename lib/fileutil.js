/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
'use strict';

var Q = require('q'),
    fs = require('graceful-fs'),
    path = require('path'),
    qutil = require('./qutil');


var stat, readdir;

stat = Q.nbind(fs.stat);
readdir = Q.nbind(fs.readdir);




/**
 * Flattens a data-structure which is a mixed Array of objects or arrays.
 * @param obj Array or obj
 * @returns {*} a flattened array
 */
function flatten(obj) {
    if (Array.isArray(obj)) {
        return obj.reduce(function (prev, curr) {
            return prev.concat(flatten(curr));
        }, []);
    }
    return [ obj ];
}


/**
 * Returns a promise whose output is an array of all files in a given
 * directory, including child directories.
 * @param dir the directory to scan
 * @returns {*} an array of files and folders
 */
function files(dir) {

    function read(dir) {
        return readdir(dir).then(function (files) {
            return files.map(function (file) {
                return path.join(dir, file);
            });
        });
    }

    return Array.isArray(dir) ? qutil.applyEach(read)(dir) : read(dir);
}


/**
 * Returns a promise whose result is an object containing a file path
 * and the stat object for the given file.
 * @param file the file for which to retrieve stats
 * @returns {*}
 */
function fileInfo(file) {

    function info(file) {
        return stat(file).then(function (stat) {
            return {
                file: file,
                stat: stat
            };
        });
    }

    return Array.isArray(file) ? qutil.applyEach(info)(file) : info(file);
}


/**
 * Returns a promise of traversal if the input file info represents a directory,
 * or a file info object if the provided info represents a file on disk.
 * @param info a file info object containing the file path and stat object.
 * @returns {*}
 */
function describe(info) {

    function desc(info) {
        if (info.stat.isDirectory()) {
            return traverse(info.file);
        }
        return info;
    }

    return Array.isArray(info) ? qutil.applyEach(desc)(info) : desc(info);

}


/**
 * Traverses the provided directory returning a data structure containing file info
 * objects organized in a way that represents the directory hierarchy.
 * @param dir
 * @returns {*}
 */
function traverse(dir) {
    return files(dir)
        .then(qutil.applyEach(fileInfo))
        .then(qutil.applyEach(describe));
}


/**
 * Traverse a directory structure and return an array of file descriptors: [{ file: 'file path', stat: {stat object} }]
 * @param dir the directory to traverse
 * @param collapse [Boolean] default false. Set to true to have the resulting data structure flattened to an array of files.
 * @param callback [Function] invoked with the signature function(err, result), if provided, otherwise a promise is returned.
 * @returns {*}
 */
exports.traverse = function (dir, collapse, callback) {
    var promise;

    if (typeof collapse === 'function') {
        callback = collapse;
        collapse = false;
    }

    promise = traverse(dir);
    if (collapse) {
        promise = promise.then(flatten);
    }

    if (typeof callback === 'function') {
        return promise.nodeify(callback);
    }

    return promise;
};


exports.describe = function (files, callback) {
    var promise;

    promise = qutil.applyEach(fileInfo)(files)
        .then(qutil.applyEach(describe));

    if (typeof callback === 'function') {
        return promise.nodeify(callback);
    }

    return promise;
};



exports.findCommonRoot = function (files, removeLocale) {
    var root, result;

    files.forEach(function (filePath) {
        var prev, curr;

        prev = [];
        curr = path.dirname(filePath).split(path.sep);

        if (!root) {
            root = curr;
            return;
        }

        root.some(function (dir, idx) {
            if (dir === curr[idx]) {
                prev.push(dir);
                return false;
            }
            return true;
        });

        root = prev;
    });

    result = root.join(path.sep);
    return removeLocale ? exports.removeLocale(result) : result;
};



exports.removeLocale = function (dir) {
    var match = dir.match(/^(?:.*)?(?=' + path.sep + '[A-Za-z][A-Za-z])/);
    return match ? match[0] : dir;
};