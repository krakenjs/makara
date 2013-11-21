 /*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
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