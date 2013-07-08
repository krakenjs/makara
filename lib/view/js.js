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
            var locals, templateInfo;

            // Reset root
            app.set('views', views);

            locals = options._locals &&  options._locals.context;
            templateInfo = templateResolver.resolve(view, locals && locals.locality);

            if (templateInfo.file) {
                // We update the view root *only* for the call to app.render.
                // It only works because the part that resolves the view path is synchronous
                // and once we get past that check our own code can take over.
                app.set('views', path.dirname(templateInfo.file));
            }

            render.apply(this, arguments);
        };
    }

    return function onLoad(name, context, callback) {
        var locals, templateInfo;

        locals = context.get('context');
        templateInfo = templateResolver.resolve(name, locals && locals.locality);

        if (!templateInfo.file) {
            callback(new Error('Could not load template ' + name));
            return;
        }

        fs.readFile(templateInfo.file, 'utf8', callback);
    };
};