/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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
            var regexp = new RegExp('([' + path.sep + ']?)$');
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