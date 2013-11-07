/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    util = require('./lib/util'),
    content = require('./lib/contentBundle');


var loadAllBundles = applyEach(loadBundle);

function applyEach(task) {
    return function (items) {
        return Q.all(items.map(task));
    }
}


function loadBundle(info) {
    var deferred;

    if (Array.isArray(info)) {
        return Q.all(info.map(loadBundle));
    }

    deferred = Q.defer();

    content.create(info, function (err, bundle) {
        if (err) {
            deferred.reject(err);
            return;
        }
        info.get = bundle.get.bind(bundle);
        deferred.resolve(info);
    });

    return deferred.promise;
}


function buildTree(files, data, depth) {
    var dir, dirs, name;

    data = data || {};
    depth = depth || 0;

    if (Array.isArray(files)) {
        // Directory
        files.forEach(function (info) {
            buildTree(info, data, depth + 1);
        });

    } else {
        // File
        dir = path.dirname(files.file);
        dirs = [];

        name = path.basename(files.file);
        name = name.replace(path.extname(files.file), '');

        // Walk up the path, excluding original root (magic number 1)
        while (depth > 1) {
            // Prepend name with dirnames deeper that 3 levels:
            // root (1, above) + country + lang directories. (magic number 3)
            if (depth > 3) {
                // Use forward slash instead of platform separators as actual
                // bundle/template names exclusively use forward-slash.
                name = path.basename(dir) + '/' + name;
            }

            // Only preserve the top two directories (country + lang),
            // so pop superfluous values (magic number 1)
            if (dirs.length > 1) {
                dirs.pop();
            }

            // Add current dir
            dirs.unshift(path.basename(dir));
            dir = path.dirname(dir);
            depth -= 1;
        }

        while (dirs.length) {
            dir = dirs.shift();
            data = data[dir] || (data[dir] = {});
        }

        data.bundle = data.bundle || (data.bundle = {});
        data.bundle[name] = files;
    }

    return data;
}




var files = require('./lib/fileutil');


files
    .traverse('test/fixtures/locales')
    .then(loadAllBundles)
    .then(buildTree)
    .done(function (files) {
        console.dir(files);
        console.log(files.US.en.bundle['test/test'].get('erik.is.cool'));
    });