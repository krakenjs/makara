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