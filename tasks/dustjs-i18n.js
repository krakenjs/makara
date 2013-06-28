'use strict';


var fs = require('fs'),
    path = require('path'),
    tagfinder = require('tagfinder'),
    content = require('../lib/contentBundle'),
    handler = require('../lib/handler');


module.exports = function (grunt) {


    grunt.registerMultiTask('dustjs-i18n', 'An i18n preprocessor for Dust.js templates.', function () {
        var that, done, options, bundles, bundleRoot;

        that = this;
        done = this.async();
        options = this.options({
            fallback: 'en_US',
            contentPath: ['locales/**/*.properties'],
            tmpDir: 'tmp'
        });


        bundles = grunt.file.expand(options.contentPath);
        bundleRoot = removeLocale(commonRoot(bundles));

        loadContent(bundleRoot, function (err, content) {

            that.files.forEach(function (file) {
                var templates, templateRoot;

                templates = file.src;
                templateRoot = commonRoot(templates);

                grunt.util.async.map(templates, function (file, next) {
                    var relative;

                    relative = file.replace(templateRoot, '');
                    if (relative[0] === path.sep) {
                        relative = relative.substr(1);
                    }

                    var tasks = [];

                    Object.keys(content).forEach(function (cn) {
                        var country = content[cn];

                        if (cn === 'bundle') {
                            return;
                        }

                        Object.keys(country).forEach(function (lang) {
                            var name, contentBundle;

                            if (lang === 'bundle') {
                                return;
                            }

                            name = path.basename(relative, '.dust');
                            contentBundle = country[lang].bundle[name] || country.bundle[name] || content.bundle[name];

                            function parseTask(next) {
                                tagfinder.parse(file, handler.create(contentBundle), function (err, result) {
                                    if (err) {
                                        next(err);
                                        return;
                                    }

                                    grunt.file.write(path.join(options.tmpDir, cn, lang, relative), result);
                                    next();
                                });
                            }

                            tasks.push(parseTask);
                        });
                    });

                    next(null, tasks);

                }, function (err, taskSet) {
                    grunt.util.async.parallel(Array.prototype.concat.apply([], taskSet), done);
                });
            });
        });
    });


    function commonRoot(paths) {
        var root;

        paths.forEach(function (filePath) {
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

        return root.join(path.sep);
    }


    function removeLocale(dir) {
        var match = dir.match(/^.*?(?=' + path.sep + '[A-Za-z][A-Za-z])/);
        return match ? match[0] : dir;
    }


    function loadContent(root, subdir, dest, depth, callback) {
        if (typeof subdir === 'function') {
            dest = subdir;
            subdir = '';
        }

        if (typeof dest === 'function') {
            depth = dest;
            dest = {};
        }

        if (typeof depth === 'function') {
            callback = depth;
            depth = 0;
        }

        fs.readdir(root, function (err, files) {
            var tasks;

            if (err) {
                callback(err);
                return;
            }

            tasks = [];

            files.forEach(function (file) {
                var filePath = path.join(root, file);

                function directoryTask(next) {
                    var content, sub;

                    content = dest;
                    sub = subdir;

                    if (depth < 3) {
                        // XXX - Magic number 2 is the depth of locale dirs (US/en) from root.
                        // Still traversing locale dirs
                        content = content[file] = {};
                    } else {
                        // Traversing bundles
                        sub = path.join(sub, file);
                    }

                    loadContent(filePath, sub, content, depth += 1, next);
                }


                function fileTask(next) {
                    var bundleName = path.basename(file, '.properties');
                    if (bundleName === file) {
                        // not a .properties file, so skip to next task
                        next();
                        return;
                    }

                    // Read content
                    content.create(filePath, function (err, bundle) {
                        if (err) {
                            next(err);
                            return;
                        }
                        dest.bundle = dest.bundle || {};
                        dest.bundle[path.join(subdir, bundleName)] = bundle;
                        next();
                    });
                }


                function stat(err, stats) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    tasks.push(stats.isDirectory() ? directoryTask : fileTask);

                    if (files.length === tasks.length) {
                        grunt.util.async.parallel(tasks, function (err) {
                            callback(err, dest);
                        });
                    }
                }

                fs.stat(filePath, stat);
            });

        });
    }


};