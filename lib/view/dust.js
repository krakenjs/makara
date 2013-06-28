'use strict';

var path = require('path'),
    finder = require('tagfinder'),
    dustjs = require('dustjs-linkedin'),
    resolver = require('../resolver'),
    handler = require('../handler'),
    metadata = require('../metadata');


function createPath(file, context) {
    var global, views;

    global = context.global;
    views = global.views || (global.settings && global.settings.views);

    return path.join(views, file + '.dust');
}


exports.create = function (app, config) {
    var bundles = resolver.create({ root: config.contentPath, ext: 'properties', fallback: config.fallback });

    return function onLoad(file, context, callback) {
        var template, locals, bundle, contentHandler;

        template = createPath(file, context);
        locals = context.get('context');
        bundle = bundles.resolve(file, locals && locals.locality);

        contentHandler = handler.create(bundle);
        if (config.enableMetadata) {
            contentHandler = metadata.decorate(contentHandler);
        }

        finder.parse(template, contentHandler, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, dustjs.compile(data, file));
        });
    };
};