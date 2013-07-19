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



module.exports = function (grunt) {


    grunt.registerMultiTask('dustjs-i18n', 'An i18n preprocessor for Dust.js templates.', function () {
        var done, options, bundles, bundleRoot;

        done = this.async();
        options = this.options({
            fallback: 'en_US',
            contentPath: ['locales/**/*.properties'],
            tmpDir: 'tmp'
        });

        bundles = grunt.file.expand(options.contentPath);
        bundleRoot = fileutil.findCommonRoot(bundles, true);

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
            .traverse(bundleRoot)
            .then(qutil.recursify(loadBundles))
            .then(restrucure)
            .then(Permuter.promise(this.filesSrc))
            .then(qutil.recursify(processTemplate))
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


/**
 * Recursified wrapper for content-traversing implementation.
 * @param bundle
 * @returns {{}}
 */
function restrucure(bundle) {
    var data = {};
    qutil.recursify(doRestructure)(bundle, data);
    return data;
}


/**
 * Traverses content hierarchy as read from filesystem to create a data structure
 * more useful when processing templates.
 * @param bundle
 * @param data
 * @returns {*}
 * @private
 */
function doRestructure(bundle, data) {
    var depth, file, dir, dirs, name;


    data = data || {};

    // Hidden arg added by recursify.
    depth = arguments[2] || 0;

    // File
    file = bundle.file;
    dir = path.dirname(file);
    dirs = [];

    name = path.basename(file);
    name = name.replace(path.extname(file), '');

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

    if (!data.bundle) {
        Object.defineProperty(data, 'bundle', {
            enumerable: false,
            value: {}
        });
    }


    data.bundle[name] = bundle;
    return data;
}


function buildContentTree(files, data, depth) {
    var dir, dirs, name;

    data = data || {};
    depth = depth || 0;

    if (Array.isArray(files)) {
        // Directory
        files.forEach(function (info) {
            buildContentTree(info, data, depth + 1);
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

        if (!data.bundle) {
            Object.defineProperty(data, 'bundle', {
                enumerable: false,
                value: {}
            });
        }

        data.bundle[name] = files;
    }

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