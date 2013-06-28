'use strict';


var fs = require('fs'),
    path = require('path'),
    resolver = require('../resolver');




exports.create = function (app, config) {
    var views, templateResolver, render;

    views = app.get('views');
    templateResolver = resolver.create({ root: views, ext: 'js', fallback: config.fallback });

    if (app.render.name !== 'clobbered') {
        // XXX - This is an awful hack.
        render = app.render;
        app.render = function clobbered(view, options, fn) {
            var file;

            // Reset root
            app.set('views', views);

            file = templateResolver.resolve(view, options._locals.context && options._locals.context.locality);
            if (file) {
                // We update the view root *only* for the call to app.render.
                // It only works because the part that resolves the view path is synchronous
                // and once we get past that check our own code can take over.
                app.set('views', path.dirname(file));
            }

            render.apply(this, arguments);
        };
    }

    return function onLoad(file, context, callback) {
        var locals, filePath;

        locals = context.get('context');
        filePath = templateResolver.resolve(file, locals && locals.locality);

        if (!filePath) {
            callback(new Error('Could not load template ' + file));
            return;
        }

        fs.readFile(filePath, 'utf8', callback);
    };
};