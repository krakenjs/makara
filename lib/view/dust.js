'use strict';

var path = require('path'),
    finder = require('tagfinder'),
    dustjs = require('dustjs-linkedin'),
    resolver = require('../resolver'),
    handler = require('../handler/default'),
    metadata = require('../handler/metadata');


function createPath(file, context) {
    var global, views;

    global = context.global;
    views = global.views || (global.settings && global.settings.views);

    return path.join(views, file + '.dust');
}


exports.create = function (app, config) {
    var bundleResolver = resolver.create({ root: config.contentPath, ext: 'properties', fallback: config.fallback });

    return function onLoad(name, context, callback) {
        var templatePath, locals, bundleInfo, contentHandler;

        templatePath = createPath(name, context);
        locals = context.get('context');
        bundleInfo = bundleResolver.resolve(name, locals && locals.locality);

        // XXX: Don't fail on missing bundle file here. We don't know if the template actually *uses* content,
        // so we late/lazy load the bundle. We'll find out then if it exists or not.
        contentHandler = handler.create(bundleInfo);
        if (config.enableMetadata) {
            // Add HTML-based annotations to output for inspecting content.
            contentHandler = metadata.decorate(contentHandler);
        }

        finder.parse(templatePath, contentHandler, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, dustjs.compile(data, name));
        });
    };
};