'use strict';


var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    tagfinder = require('tagfinder'),
    util = require('../lib/util'),
    qutil = require('../lib/qutil'),
    fileutil = require('../lib/fileutil'),
    bundle = require('../lib/provider/bundle'),
    handler = require('../lib/handler/default');


function endsWith(str, frag) {
    return str.lastIndexOf(frag) === (str.length - frag.length);
}


module.exports = function (grunt) {


    grunt.registerMultiTask('dustjs-i18n', 'An i18n preprocessor for Dust.js templates.', function () {
        var done, options, contentPath, bundles, bundleRoot;

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
            if (!endsWith(cp, '/**/*.properties')) {
                return cp.replace(/([\/]?)$/, '/**/*.properties');
            }
            return cp;
        });


        bundleRoot = contentPath.map(function (cp) {
            return cp.replace('/**/*.properties', '');
        });

        // TODO: Currently only honors one locale directory.
        bundleRoot = Array.isArray(bundleRoot) ? bundleRoot[0] : bundleRoot;
        bundles = grunt.file.expand(contentPath);


        function processTemplate(metadata) {
            var deferred = Q.defer();

            tagfinder.parse(metadata.src, handler.create(metadata.provider), function (err, result) {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                grunt.file.write(path.join(options.tmpDir, metadata.dest), result);
                deferred.resolve(metadata);
            });

            return deferred.promise;
        }


        fileutil
            .describe(bundles)
            .then(qutil.applyEach(loadBundles))
            .then(qutil.applyEach(removeRoot(bundleRoot)))
            .then(restructure)
            .then(Permuter.promise(this.filesSrc))
            .then(qutil.applyEach(processTemplate))
            .done(
                function () {
                    done();
                },
                function (err) {
                    console.dir(err.stack);
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

        name = path.basename(bundle.rel);
        name = name.replace(path.extname(name), '');

        while (dirs.length) {
            dir = dirs.shift();
            if (c < 2) {
                // The first two dirs are country/lang
                d = d[dir] || (d[dir] = {});
            } else {
                // remaining dirs are part of name
                name = dir + '/' + name;
            }
            c++;
        }

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
            var metadata, root;

            metadata = [];
            root = this.root;

            this.files.forEach(function (file) {
                var relative, name;

                relative = file.replace(root, '');
                if (relative[0] === path.sep) {
                    relative = relative.substr(1);
                }

                name = relative.replace(path.extname(relative), '');

                Object.keys(content).forEach(function (cn) {
                    Object.keys(content[cn]).forEach(function (lang) {
                        var langBundle = content[cn][lang].bundle || {},
                            countryBundle = content[cn].bundle || {},
                            fallbackBundle = content.bundle || {};

                        metadata.push({
                            src: file,
                            dest: path.join(cn, lang, relative),
                            provider: langBundle[name] || countryBundle[name] || fallbackBundle[name]
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
    create: function (files) {
        return Object.create(Permuter._proto, {
            files: {
                value: files
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
    promise: function (files) {
        var permuter = this.create(files);

        return function (content) {
            var deferred = Q.defer();
            deferred.resolve(permuter.permute(content));
            return deferred.promise;
        }
    }
};