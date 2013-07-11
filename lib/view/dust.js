'use strict';

var path = require('path'),
    dustjs = require('dustjs-linkedin'),
    translator = require('../translator');


exports.create = function (app, translator) {
    return function onLoad(name, context, callback) {
        var global, locals, locality, views;

        global = context.global;
        locals = context.get('context');
        locality = locals && locals.locality;
        views = global.views || (global.settings && global.settings.views);

        translator.localize(name, locality, views, function (err, data) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, dustjs.compile(data, name));
        });
    };
};

//exports.create_old = function (app, config) {
//    var options, translator;
//
//    options = {
//        templateRoot: app.get('views'),
//        contentRoot: config.contentPath,
//        fallbackLocale: config.fallback,
//        enableHTMLMetadata: config.enableMetadata
//    };
//
//    translator = translatorFactory.create(options);
//
//    return function onLoad(name, context, callback) {
//        var global, locals, locality, views;
//
//        global = context.global;
//        locals = context.get('context');
//        locality = locals && locals.locality;
//        views = global.views || (global.settings && global.settings.views);
//
//        translator.localize(name, locality, views, function (err, data) {
//            if (err) {
//                callback(err);
//                return;
//            }
//            callback(null, dustjs.compile(data, name));
//        });
//    };
//};

