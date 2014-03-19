'use strict';

var Q = require('q'),
    path = require('path'),
    tagfinder = require('findatag'),
    util = require('../lib/util'),
    bundle = require('../lib/provider/bundle'),
    handler = require('../lib/handler/default'),
    through = require('through2'),
    File = require('vinyl'),

    pathName = path.join('**','*.properties');


module.exports = function(gulp){
    // Turn a bundle into a content hierarchy like the following:
    //        locales
    //       /      \
    //      US      CA
    //     /  \    /  \
    //    es  en  fr  en
    function parseBundle(bundle, locales) {
        var dir = path.dirname(bundle.rel),
            dirs = [],
            name = '',
            c = 0,
            d = locales;

        while (dir !== '.') {
            dirs.unshift(path.basename(dir));
            dir = path.dirname(dir);
        }

        while (dirs.length) {
            dir = dirs.shift();
            if (c < 2) {
                // The first two dirs are country/lang
                d = d[dir] || (d[dir] = {});
            } else {
                // remaining dirs are part of name
                name = name + dir + path.sep;
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
    }

    // Create all possible locale permutations for a template
    // returns an array of metadata objects encompassing all locales
    // with src, destination and provider bundle / object
    function permute(template_file, locales, fallback){
        var metadata = [],
            relative = template_file.relative,
            fallbackCn = fallback.country,
            fallbackLang = fallback.language;

        if (relative.charAt(0) === path.sep) {
            relative = relative.substr(1);
        }
        var bundle_name = relative.replace(path.extname(relative), '');
        Object.keys(locales).forEach(function (cn) {
            Object.keys(locales[cn]).forEach(function (lang) {
                var langBundle = locales[cn][lang].bundle || {},
                    countryBundle = locales[cn].bundle || {},
                    rootBundle = locales.bundle || {},
                    fallbackLangBundle = locales[fallbackCn][fallbackLang].bundle || {},
                    fallbackCountryBundle = locales[fallbackCn].bundle || {},
                    fallbackBundle = locales.bundle || {};

                metadata.push({
                    src: template_file.path,
                    dest: path.join(cn, lang, relative),
                    provider: langBundle[bundle_name] || countryBundle[bundle_name] || rootBundle[bundle_name] || fallbackLangBundle[bundle_name] || fallbackCountryBundle[bundle_name] || fallbackBundle[bundle_name]
                });
            });
        });

        return metadata;
    }

    // Create makara bundles from property files
    function createBundle(file, enc, callback){
        var self = this;
        bundle.create({
            file: file.path,
            name: path.basename(file.path, path.extname(file.path))
        }).load(function(err, bundle){
            if (err){
                console.log('Bundle Load Error');
                console.log(err);
                return callback();
            }
            bundle.rel = file.relative;
            self.push(bundle);
            return callback();
        });
    }

    // Return a function that can be used for stream processing of template files
    // creating a copy of a file for every locale in the locales object
    // expects to receive an object of locales (result of parseBundle) and the fallback locale
    function permuteTemplates(locales, fallback){
        return function(file, enc, cb){
            var self = this;
            var metadata = permute(file, locales, util.parseLangTag(fallback));
            metadata.forEach(function(meta){
                self.push({file: file, metadata: meta});
            });
            cb();
        };
    }

    // Use findatag to parse each template (already broken out for each locale)
    // the result is a new file object that has the @pre tag replaced with the content for the locale
    function parseTemplate(file_metadata, enc, cb){
        var self = this;
        if (!file_metadata.metadata.provider){
            // No bundle, so skip trying to parse
            self.push(new File({path: file_metadata.metadata.dest, contents: file_metadata.file.contents}));
            return cb();
        }
        tagfinder.parse(file_metadata.metadata.src, handler.create(file_metadata.metadata.provider), function(err, result){
            if (err){
                console.log('Parse Error', err);
                return cb();
            }
            self.push(new File({path: file_metadata.metadata.dest, contents: new Buffer(result)}));
            return cb();
        });
    }

    // Process all property files, returning a stream without any output
    // instead of returning the bundles, add their data to the locales object
    function processPropertyFiles(content_path_glob, locales){
        return gulp.src(content_path_glob)
            // create a bundle for each and every property file
            .pipe(through.obj(createBundle))
            // parse the bundle, adding it to the locales object
            .pipe(through.obj(function(bundle, enc, cb){
                parseBundle(bundle, locales);
                cb();
            }));
    }

    // Process all templates, provided by the files_src_glob
    // * extract the metadata from each file (src location, destination location, provider)
    // * parse the template for the tag and replace it with the locales + key's content
    // * write the file out to the destination
    function processAllTemplates(files_src_glob, locales, destination, fallback){
        return gulp.src(files_src_glob)
            .pipe(through.obj(permuteTemplates(locales, fallback)))
            .pipe(through.obj(parseTemplate))
            .pipe(gulp.dest(destination));
    }

    // General Process
    // * look up all the property files that makara should be using to do it's processing
    // * take the contents of the property files and turn them in to a javascript object
    //   keyed by country then language
    // * find all the templates that should be processed
    // * parse each template for @pre tags and replace each one with the appropriate content
    //   from the locale object
    // * put the templates, without @pre tags, in the destination location
    function makaraTask(opt) {
        if (!opt.src) {
            console.log('Please provide a source location for templates');
            return;
        }
        var files_src_glob = opt.src,
            content_path_glob = opt.contentPath || [path.join('locales', pathName)],
            dest = opt.tmpDir || 'tmp',
            fallback_locale = opt.fallback || 'en_US',
            task_promise = Q.defer(),
            locales = {};

        processPropertyFiles(content_path_glob, locales)
        // once the entire pipeline of property files has been consumed
        // start processing the templates
        .on('finish', function(){
            processAllTemplates(files_src_glob, locales, dest, fallback_locale)
            .on('end', task_promise.resolve);
        });
        // This promise is returned so gulp will show the proper timing
        return task_promise.promise;
    }

    return {
        // export individual tasks for more control
        createBundle: createBundle,
        processPropertyFiles: processPropertyFiles,
        permuteTemplates: permuteTemplates,
        parseTemplate: parseTemplate,
        processAllTemplates: processAllTemplates,
        // Use this export if you want control over your task dependencies
        // but don't need to modify any of the pipeline
        makaraTask: makaraTask,
        // Use this if you don't care what your dependencies are and just want to run the gulp task
        register: function(opt){
            gulp.task('makara', function(){
                return makaraTask(opt);
            });
        }
    }
};