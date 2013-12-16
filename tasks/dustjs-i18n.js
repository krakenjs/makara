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
    domain = require('domain'),
    tagfinder = require('findatag'),
    util = require('../lib/util'),
    qutil = require('../lib/qutil'),
    fileutil = require('../lib/fileutil'),
    bundle = require('../lib/provider/bundle'),
    handler = require('../lib/handler/default');


function endsWith(str, frag) {
    return str.lastIndexOf(frag) === (str.length - frag.length);
}


module.exports = function (grunt) {


    grunt.registerMultiTask('makara', 'An i18n preprocessor for Dust.js templates.', function () {
        var done, options, contentPath, bundles, bundleRoot;
        var pathName = path.sep + '**' + path.sep + '*.properties';

        done = this.async();
        options = this.options({
            fallback: 'en_US',
            contentPath: ['locales'],
            tmpDir: 'tmp'
        });

        contentPath = options.contentPath;
        if (!Array.isArray(contentPath)) {
            contentPath = [contentPath];
        }

        contentPath = contentPath.map(function (cp) {
            var regexp = new RegExp('([\\' + path.sep + ']?)$');
            if (!endsWith(cp, pathName)) {
                return cp.replace(regexp, pathName);
            }
            return cp;
        });


        bundleRoot = contentPath.map(function (cp) {
            return cp.replace(pathName, '');
        });

        // TODO: Currently only honors one locale directory.
        bundleRoot = Array.isArray(bundleRoot) ? bundleRoot[0] : bundleRoot;
        bundles = grunt.file.expand(contentPath);


        function processTemplate(metadata) {
            var deferred, domane;

            deferred = Q.defer();
            domane = domain.create();
            domane.on('error', function (err) {
                err.message += ' (Source: ' + metadata.src + ')';
                deferred.reject(err);
            });

            domane.run(function () {
                tagfinder.parse(metadata.src, handler.create(metadata.provider), function (err, result) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }

                    grunt.file.write(path.join(options.tmpDir, metadata.dest), result);
                    deferred.resolve(metadata);
                });
            });

            return deferred.promise;
        }


        fileutil
            .describe(bundles)
            .then(qutil.applyEach(loadBundles))
            .then(qutil.applyEach(removeRoot(bundleRoot)))
            .then(restructure)
            .then(Permuter.promise(this.filesSrc, util.parseLangTag(options.fallback)))
            .then(qutil.applyEach(processTemplate))
            .done(
                function () {
                    done();
                },
                function (err) {
                    console.log(err.stack);
                    done(!err);
                }
            );

    });


};


function loadBundles(fileInfo) {
    var deferred = Q.defer();
    bundle.create(fileInfo).load(function (err, bundle) {
        if (err) {
            deferred.reject(err);
            return;
        }
        deferred.resolve(bundle);
    });
    return deferred.promise;
}


function removeRoot(root) {
    return function (bundle) {
        bundle.rel = path.relative(root, bundle.file);
        return bundle;
    }
}

// Turn an array of bundles into a content hierarchy.
function restructure(bundles) {
    var data = {};

    bundles.forEach(function (bundle) {
        var dir, dirs, name, c, d;

        // Remove the root dir from the full path
        //rel = path.relative(root, bundle.file);
        dir = path.dirname(bundle.rel);
        dirs = [];

        while (dir !== '.') {
            dirs.unshift(path.basename(dir));
            dir = path.dirname(dir);
        }

        c = 0;
        d = data;
        name = '';

        while (dirs.length) {
            dir = dirs.shift();
            if (c < 2) {
                // The first two dirs are country/lang
                d = d[dir] || (d[dir] = {});
            } else {
                // remaining dirs are part of name
                name = name + dir + '/';
            }
            c++;
        }

        name = name + path.basename(bundle.rel);
        name = name.replace(path.extname(name), '');

        if (!d.bundle) {
            Object.defineProperty(d, 'bundle', {
                enumerable: false,
                value: {}
            });
        }

        d.bundle[name] = bundle;
    });

    return data;

}


/**
 * Generates all permutations of country/language/template and
 * maps them to metadata objects with the structure:
 * {
 *   src: String,
 *   dest: String,
 *   bundle: Object
 * }
 * where `src` is the source template file, `dest` is the path of where
 * the localized template should be written, and `bundle` is the content
 * bundle associated with that particular template.
 * @type {{create: Function, promise: Function}}
 */
var Permuter = {
    _proto: {

        permute: function (content) {
            var metadata, root, fallback;

            metadata = [];
            root = this.root;
            fallback = this.fallback;

            this.files.forEach(function (file) {
                var relative, name, fallbackCn, fallbackLang;

                relative = file.replace(root, '');
                if (relative[0] === path.sep) {
                    relative = relative.substr(1);
                }

                name = relative.replace(path.extname(relative), '');
                fallbackCn = fallback.country;
                fallbackLang = fallback.language;

                Object.keys(content).forEach(function (cn) {
                    Object.keys(content[cn]).forEach(function (lang) {
                        var langBundle = content[cn][lang].bundle || {},
                            countryBundle = content[cn].bundle || {},
                            rootBundle = content.bundle || {},
                            fallbackLangBundle = content[fallbackCn][fallbackLang].bundle || {},
                            fallbackCountryBundle = content[fallbackCn].bundle || {},
                            fallbackBundle = content.bundle || {};

                        metadata.push({
                            src: file,
                            dest: path.join(cn, lang, relative),
                            provider: langBundle[name] || countryBundle[name] || rootBundle[name] || fallbackLangBundle[name] || fallbackCountryBundle[name] || fallbackBundle[name]
                        });
                    });
                });
            });

            return metadata;
        }

    },

    /**
     * Creates a `permuter` object which will process the specified files.
     * @param files the files for which to create country/lang permutations
     * @returns {*} a `permuter` instance
     */
    create: function (files, fallback) {
        return Object.create(Permuter._proto, {
            files: {
                value: files
            },
            fallback: {
                value: fallback
            },
            root: {
                value: fileutil.findCommonRoot(files)
            }
        })
    },

    /**
     * Creates a `permuter` promise which processes the permutations for the provided
     * files and resolves to the predefined metadata object.
     * @param files the files for which to create country/lang permutations
     * @returns {Function} a permuter promise
     */
    promise: function (files, fallback) {
        var permuter = this.create(files, fallback);

        return function (content) {
            var deferred = Q.defer();
            deferred.resolve(permuter.permute(content));
            return deferred.promise;
        }
    }
};